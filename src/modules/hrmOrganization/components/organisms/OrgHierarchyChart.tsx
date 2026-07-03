'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { Spin, Empty, Button, Tag, Tooltip, Avatar, Segmented } from 'antd';
import {
  ApartmentOutlined,
  BankOutlined,
  TeamOutlined,
  ShopOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { HrmEmployeeService } from '../../../hrmEmployee/services/hrmEmployeeService';
import type {
  EmployeeDirectoryRow,
  EmployeeHierarchyNode,
} from '../../../hrmEmployee/types/api.types';
import type { OrgHierarchy, DepartmentNode } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import styles from '../../styles/OrgChart.module.css';

/* ------------------------------------------------------------------ */
/*  Pan canvas constants                                               */
/* ------------------------------------------------------------------ */
// Empty margin (px) rendered around the tree inside the scroll canvas. This
// gives the chart a Miro / whiteboard "movable" feel: there's always room to
// drag/pan the tree in every direction even when it would otherwise fit the
// viewport, and it guarantees the canvas always has something to scroll so
// the drag-to-pan gesture and the X/Y scrollbars work consistently.
const STAGE_PAD = 200;
// Scroll offset that parks the tree's top-left just inside the viewport (a
// small visible margin in from the padding edge). Used as the "home" position
// on first load and after Fit / 100%.
const STAGE_HOME = STAGE_PAD - 24;

/* ------------------------------------------------------------------ */
/*  Reporting tree — pure data layer                                   */
/* ------------------------------------------------------------------ */

interface ReportingNodeData {
  emp: EmployeeDirectoryRow;
  reports: ReportingNodeData[];
}

interface ReportingTree {
  head: ReportingNodeData;
  orphans: EmployeeDirectoryRow[];
}

const norm = (s: string | undefined | null): string =>
  (s || '').toLowerCase().trim();

/**
 * Resolve a usable <img> src for an employee photo. Prefers a base64 payload
 * (wrapping bare base64 in a data: URL) and falls back to a plain photoUrl.
 * Returns undefined when neither is present so the caller can render the
 * empty placeholder icon.
 */
const resolvePhotoSrc = (
  emp: { photoBase64?: string | null; photoUrl?: string | null },
): string | undefined => {
  const b64 = emp.photoBase64;
  if (b64) {
    return b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
  }
  return emp.photoUrl || undefined;
};

/**
 * Build a reporting tree rooted at the dept head from a flat list of
 * employees in a single department.
 *
 * Returns null when:
 *   - headId is falsy, OR
 *   - no employee in `employees` matches headId (by handle or employeeCode).
 *
 * Caller falls back to flat rendering when null is returned.
 */
const buildReportingTree = (
  employees: EmployeeDirectoryRow[],
  headId: string | undefined,
): ReportingTree | null => {
  const headKey = norm(headId);
  if (!headKey) return null;

  const head = employees.find(
    (e) => norm(e.handle) === headKey || norm(e.employeeCode) === headKey,
  );
  if (!head) return null;

  // Handles of every employee in this dept — used to decide whether a
  // given manager reference points inside or outside the dept.
  const inDept = new Set(employees.map((e) => norm(e.handle)));

  // Group by lowercased manager handle. Only keep groupings where the
  // manager is in this dept; everyone else becomes an orphan.
  const childrenByManager: Record<string, EmployeeDirectoryRow[]> = {};
  const orphans: EmployeeDirectoryRow[] = [];

  for (const emp of employees) {
    if (norm(emp.handle) === headKey) continue; // head is not its own orphan
    const mgr = norm(emp.reportingManager);
    if (!mgr || mgr === norm(emp.handle) || !inDept.has(mgr)) {
      orphans.push(emp);
      continue;
    }
    if (!childrenByManager[mgr]) childrenByManager[mgr] = [];
    childrenByManager[mgr].push(emp);
  }

  // Sort direct reports / orphans by fullName for stable rendering.
  const byName = (a: EmployeeDirectoryRow, b: EmployeeDirectoryRow) =>
    (a.fullName || '').localeCompare(b.fullName || '', undefined, {
      sensitivity: 'base',
    });
  Object.values(childrenByManager).forEach((list) => list.sort(byName));
  orphans.sort(byName);

  // Recurse from head with a visited guard for cycles.
  const visited = new Set<string>();
  const buildNode = (emp: EmployeeDirectoryRow): ReportingNodeData => {
    visited.add(norm(emp.handle));
    const directs = childrenByManager[norm(emp.handle)] || [];
    const reports: ReportingNodeData[] = [];
    for (const child of directs) {
      if (visited.has(norm(child.handle))) continue; // cycle — drop
      reports.push(buildNode(child));
    }
    return { emp, reports };
  };

  const headNode = buildNode(head);

  // Safety net: any dept employee not reached via the recursion AND not
  // already classified as an orphan goes to orphans. This catches
  // subtrees hanging off a cycle or other weird shapes.
  const reachable = visited;
  const orphanHandles = new Set(orphans.map((o) => norm(o.handle)));
  for (const emp of employees) {
    const h = norm(emp.handle);
    if (h === headKey) continue;
    if (reachable.has(h)) continue;
    if (orphanHandles.has(h)) continue;
    orphans.push(emp);
  }
  orphans.sort(byName);

  return { head: headNode, orphans };
};

/* ------------------------------------------------------------------ */
/*  Shared employee card body — role header + photo + name             */
/* ------------------------------------------------------------------ */
const EmployeeCardBody: React.FC<{
  emp: EmployeeDirectoryRow;
  isHead?: boolean;
}> = ({ emp, isHead = false }) => {
  const photo = resolvePhotoSrc(emp);
  return (
    <div className={`${styles.chartCard} ${styles.employeeCard}`}>
      {/* Header row — employee name */}
      <div
        className={`${styles.empNameHeader} ${isHead ? styles.empNameHeaderHead : ''}`}
      >
        {emp.fullName}
      </div>
      {/* Second row — photo on the left, role + department on the right */}
      <div className={styles.empBody}>
        {photo ? (
          <Avatar src={photo} size={48} shape="square" />
        ) : (
          <Avatar size={48} shape="square" icon={<UserOutlined />} />
        )}
        <div className={styles.empMeta}>
          {/* Show designation (job title) in the reporting tree; fall back to role. */}
          <div className={styles.empRole}>{emp.designation || emp.role || 'EMPLOYEE'}</div>
          <div className={styles.empDept}>{emp.department || '—'}</div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Employee leaf card                                                 */
/* ------------------------------------------------------------------ */
const EmployeeCard: React.FC<{ emp: EmployeeDirectoryRow }> = ({ emp }) => (
  <li className={styles.chartNode}>
    <EmployeeCardBody emp={emp} />
  </li>
);

/* ------------------------------------------------------------------ */
/*  Reporting tree node — recursive employee card                      */
/* ------------------------------------------------------------------ */
const ReportingNode: React.FC<{
  node: ReportingNodeData;
  isHead: boolean;
}> = ({ node, isHead }) => {
  const { emp, reports } = node;
  return (
    <li className={styles.chartNode}>
      <EmployeeCardBody emp={emp} isHead={isHead} />
      {reports.length > 0 && (
        <ul className={styles.chartChildren}>
          {reports.map((child) => (
            <ReportingNode key={child.emp.handle} node={child} isHead={false} />
          ))}
        </ul>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ */
/*  Hierarchy employee node — renders backend EmployeeHierarchyNode    */
/*  directly, with a photo lookup keyed by employee handle             */
/* ------------------------------------------------------------------ */
const HierarchyEmployeeNode: React.FC<{
  node: EmployeeHierarchyNode;
  photoByHandle: Record<string, string | undefined>;
  isRoot: boolean;
}> = ({ node, photoByHandle, isRoot }) => {
  const reports = node.directReports || [];
  // Adapt to the EmployeeDirectoryRow shape that EmployeeCardBody expects.
  // The backend hierarchy DTO lacks photoUrl, so we look it up from the
  // directory fetch. Fields not on the DTO (phone, businessUnits, etc.)
  // aren't used by the card, so undefined/defaults are fine.
  const cardEmp: EmployeeDirectoryRow = {
    handle: node.handle,
    employeeCode: node.employeeCode,
    fullName: node.fullName,
    workEmail: node.workEmail,
    status: (node.status as EmployeeDirectoryRow['status']) || 'ACTIVE',
    department: node.department,
    role: node.role || node.designation || '',
    // Reporting tree shows the employee's designation (job title), not the access role.
    designation: node.designation || node.role || '',
    photoUrl: photoByHandle[node.handle],
  };
  return (
    <li className={styles.chartNode}>
      <EmployeeCardBody emp={cardEmp} isHead={isRoot} />
      {reports.length > 0 && (
        <ul className={styles.chartChildren}>
          {reports.map((child) => (
            <HierarchyEmployeeNode
              key={child.handle}
              node={child}
              photoByHandle={photoByHandle}
              isRoot={false}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// Total employee count across a hierarchy forest (pre-order).
const countHierarchy = (nodes: EmployeeHierarchyNode[]): number =>
  nodes.reduce(
    (sum, n) => sum + 1 + countHierarchy(n.directReports || []),
    0,
  );

/* ------------------------------------------------------------------ */
/*  Dept card — recursive (now also renders employees)                 */
/* ------------------------------------------------------------------ */
const DeptCard: React.FC<{
  dept: DepartmentNode;
  depth: number;
  employeesByDept: Record<string, EmployeeDirectoryRow[]>;
}> = ({ dept, depth, employeesByDept }) => {
  const childDepts = dept.children || [];
  // Match employees by both deptName and deptCode (case-insensitive) — backend
  // and frontend may use different identifiers, so check both keys.
  const deptEmployees = useMemo(() => {
    const byName = employeesByDept[(dept.deptName || '').toLowerCase().trim()] || [];
    const byCode = employeesByDept[(dept.deptCode || '').toLowerCase().trim()] || [];
    // De-duplicate by handle in case both keys overlap.
    const seen = new Set<string>();
    return [...byName, ...byCode].filter((e) => {
      if (seen.has(e.handle)) return false;
      seen.add(e.handle);
      return true;
    });
  }, [employeesByDept, dept.deptName, dept.deptCode]);

  const reportingTree = useMemo(
    () => buildReportingTree(deptEmployees, dept.headOfDepartmentEmployeeId),
    [deptEmployees, dept.headOfDepartmentEmployeeId, dept.handle],
  );

  // Dev diagnostic: head id is set but doesn't resolve to an employee in
  // the dept's member list. Falls back to flat rendering below.
  useEffect(() => {
    if (dept.headOfDepartmentEmployeeId && !reportingTree && deptEmployees.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[OrgHierarchyChart] Dept "${dept.deptName}" (${dept.deptCode}) has headOfDepartmentEmployeeId="${dept.headOfDepartmentEmployeeId}" but no matching employee in its member list — falling back to flat render.`,
      );
    }
  }, [dept.deptName, dept.deptCode, dept.headOfDepartmentEmployeeId, reportingTree, deptEmployees.length]);

  const totalChildren = childDepts.length + deptEmployees.length;
  const hasChildren = totalChildren > 0;
  const [collapsed, setCollapsed] = useState(depth > 2);

  return (
    <li className={styles.chartNode}>
      <Tooltip title={dept.headOfDepartmentEmployeeId ? `Head: ${dept.headOfDepartmentEmployeeId}` : undefined}>
        <div
          className={`${styles.chartCard} ${styles.deptCard}`}
          onClick={() => hasChildren && setCollapsed(!collapsed)}
          style={{ cursor: hasChildren ? 'pointer' : 'default' }}
        >
          <TeamOutlined className={styles.cardIcon} style={{ color: '#722ed1' }} />
          <div className={styles.cardContent}>
            <div className={styles.cardName}>{dept.deptName}</div>
            <div className={styles.cardCode}>
              {dept.deptCode}
              {deptEmployees.length > 0 && (
                <span style={{ marginLeft: 6, color: '#1890ff' }}>
                  · {deptEmployees.length} {deptEmployees.length === 1 ? 'member' : 'members'}
                </span>
              )}
            </div>
          </div>
          {hasChildren && (
            <span className={styles.childCount}>
              {collapsed ? `+${totalChildren}` : '−'}
            </span>
          )}
        </div>
      </Tooltip>

      {hasChildren && !collapsed && (
        <ul className={styles.chartChildren}>
          {childDepts.map((child) => (
            <DeptCard
              key={child.handle}
              dept={child}
              depth={depth + 1}
              employeesByDept={employeesByDept}
            />
          ))}
          {reportingTree ? (
            <>
              <ReportingNode node={reportingTree.head} isHead={true} />
              {reportingTree.orphans.map((emp) => (
                <EmployeeCard key={emp.handle} emp={emp} />
              ))}
            </>
          ) : (
            deptEmployees.map((emp) => (
              <EmployeeCard key={emp.handle} emp={emp} />
            ))
          )}
        </ul>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Chart component                                               */
/* ------------------------------------------------------------------ */
type ViewMode = 'org' | 'tree';

interface OrgHierarchyChartProps {
  /**
   * When set, locks the chart to a single view and hides the segmented
   * Org Structure / Reporting Tree switcher. Used by hosts that want to
   * embed only one view (e.g. a dedicated Reporting Tree page).
   */
  forceViewMode?: ViewMode;
}

const OrgHierarchyChart: React.FC<OrgHierarchyChartProps> = ({ forceViewMode }) => {
  const { hierarchy, fetchHierarchy } = useHrmOrganizationStore();
  const { data, isLoading } = hierarchy;

  // Zoom is tracked per view so toggling between Org Structure and
  // Reporting Tree doesn't drag one view's zoom onto the other — each
  // view remembers where the user left it.
  const [zoomByView, setZoomByView] = useState<Record<ViewMode, number>>({ org: 1, tree: 1 });
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('org');
  const viewMode: ViewMode = forceViewMode ?? internalViewMode;
  const setViewMode = setInternalViewMode;
  const zoom = zoomByView[viewMode];
  const setZoom = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setZoomByView((prev) => {
        const cur = prev[viewMode];
        const next = typeof updater === 'function' ? (updater as (n: number) => number)(cur) : updater;
        return { ...prev, [viewMode]: next };
      });
    },
    [viewMode],
  );
  // Raw fetched data — scoping/filtering happens in the memoized
  // `employees` / `empHierarchy` derivations below so all downstream
  // code (groupings, render, counts) sees only company-scoped data.
  const [rawEmployees, setRawEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [rawEmpHierarchy, setRawEmpHierarchy] = useState<EmployeeHierarchyNode[]>([]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // Organization name for the currently-viewed company — needed by the
  // backend hierarchy endpoint, which scopes to site + organization.
  const orgName =
    data?.company?.legalName ?? data?.company?.companyName ?? '';

  // Fetch directory + employee-hierarchy in parallel. Directory is used for
  // the Org Structure view (dept grouping) and also provides photoUrl which
  // the hierarchy DTO doesn't carry. Hierarchy powers the Reporting Tree view.
  // Re-runs once the company data lands so orgName is populated before the
  // hierarchy call.
  useEffect(() => {
    // CRITICAL: scope the directory + employee-hierarchy fetches to the
    // company whose detail page is being viewed — NOT the global org
    // selection in CommonAppBar. The viewer can be on Company A's
    // detail page while the header switcher still shows Company B; the
    // data here must reflect the page's company.
    //
    // data.company.organizationId is the company's own org id. We cast
    // because the typed CompanyProfile only exposes `site`, but the
    // backend payload reliably carries `organizationId` as the canonical
    // scoping key for that company. Fall back through `site` then the
    // cookie if missing.
    const companyOrgId =
      ((data?.company as unknown as { organizationId?: string })?.organizationId) ||
      data?.company?.site ||
      getOrganizationId();
    if (!companyOrgId || !orgName) return;
    let cancelled = false;
    Promise.all([
      HrmEmployeeService.fetchDirectory({ organizationId: companyOrgId, page: 0, size: 500 }).catch(
        () => ({ employees: [] } as { employees: EmployeeDirectoryRow[] }),
      ),
      HrmEmployeeService.fetchEmployeeHierarchy(companyOrgId, orgName).catch(
        () => [] as EmployeeHierarchyNode[],
      ),
    ]).then(([dirRes, hier]) => {
      if (cancelled) return;
      setRawEmployees((dirRes?.employees || []) as EmployeeDirectoryRow[]);
      setRawEmpHierarchy(hier || []);
    });
    return () => {
      cancelled = true;
    };
    // Re-fetch whenever the company being viewed changes (orgName covers
    // the legalName change; the explicit organizationId dep covers the
    // case where two distinct companies share a legalName).
  }, [orgName, data?.company?.handle]);

  // Trust the backend's company-scoped response (the fetch above
  // already uses data.company.organizationId, so the server returns
  // only the viewed company's employees). Earlier we tried a defensive
  // client-side filter against data.businessUnits[].handle, but the
  // directory's `businessUnits` field carries name strings ("BU_NAME -
  // BU_CODE") rather than UUID handles — so format mismatch wiped
  // every row. Backend scoping is the right enforcement point here.
  const employees = rawEmployees;

  // Reporting Tree fallback: if the dedicated /employee/hierarchy
  // endpoint returns nothing (observed when scoping discrepancies
  // exist between the hierarchy table and the directory), build a
  // tree directly from the directory using the reportingManager
  // field. Employees whose manager is also in scope nest under that
  // manager; otherwise they become roots. Avoids the "0 Employees /
  // No employee hierarchy data" empty state when Org Structure
  // (which uses the directory) clearly shows employees.
  const empHierarchy = useMemo<EmployeeHierarchyNode[]>(() => {
    if (rawEmpHierarchy.length > 0) return rawEmpHierarchy;
    if (rawEmployees.length === 0) return [];

    const byHandle = new Map<string, EmployeeHierarchyNode>();
    for (const e of rawEmployees) {
      byHandle.set(e.handle, {
        handle: e.handle,
        employeeCode: e.employeeCode,
        fullName: e.fullName,
        workEmail: e.workEmail,
        status: e.status as unknown as string,
        department: e.department || '',
        role: e.role || '',
        designation: (e as unknown as { designation?: string }).designation || '',
        location: e.location || '',
        reportingManager: e.reportingManager || '',
        level: 0,
        directReports: [],
      });
    }

    const roots: EmployeeHierarchyNode[] = [];
    for (const e of rawEmployees) {
      const node = byHandle.get(e.handle);
      if (!node) continue;
      // reportingManager field has been observed as either a manager's
      // handle or their employeeCode; try both lookups before giving up.
      const mgrKey = (e.reportingManager || '').trim();
      const managerNode =
        (mgrKey && byHandle.get(mgrKey)) ||
        rawEmployees
          .map((c) => (c.employeeCode === mgrKey ? byHandle.get(c.handle) : undefined))
          .find((n): n is EmployeeHierarchyNode => !!n);
      if (managerNode && managerNode.handle !== node.handle) {
        managerNode.directReports.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, [rawEmpHierarchy, rawEmployees]);

  // Group employees by department. Key on lowercased trimmed name AND code
  // since the dept might be referenced either way.
  const employeesByDept = useMemo(() => {
    const map: Record<string, EmployeeDirectoryRow[]> = {};
    for (const emp of employees) {
      const key = (emp.department || '').toLowerCase().trim();
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(emp);
    }
    return map;
  }, [employees]);

  // photoUrl lookup for Reporting Tree view — backend hierarchy DTO doesn't
  // carry photoUrl, so join against the directory by handle.
  const photoByHandle = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const emp of employees) {
      const src = resolvePhotoSrc(emp);
      if (src) map[emp.handle] = src;
    }
    return map;
  }, [employees]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleZoomReset = () => setZoom(1);

  // Native scroll panning. The canvas uses `overflow: auto`, so the scaled
  // content overflows and produces real X *and* Y scrollbars. On top of that
  // we keep Miro / Figma style drag-to-pan — but instead of a CSS translate
  // (which is invisible to the scroll area) the drag drives the canvas's
  // scrollLeft/scrollTop, so dragging and the scrollbars stay in sync.
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Per-view saved scroll offset so toggling Org Structure / Reporting Tree
  // restores where the user left each view. Defaults to the "home" position
  // so the tree is in view (not lost in the surrounding canvas padding).
  const scrollByView = useRef<Record<ViewMode, { left: number; top: number }>>({
    org: { left: STAGE_HOME, top: STAGE_HOME },
    tree: { left: STAGE_HOME, top: STAGE_HOME },
  });
  const dragState = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;
    const el = canvasRef.current;
    if (!el) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: el.scrollLeft,
      startTop: el.scrollTop,
    };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const el = canvasRef.current;
    if (!el) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    // Drag content to the right → reveal content on the left → scrollLeft
    // decreases (and likewise for the vertical axis).
    el.scrollLeft = dragState.current.startLeft - dx;
    el.scrollTop = dragState.current.startTop - dy;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    setIsDragging(false);
    const el = canvasRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }, []);

  // Remember the active view's scroll position on every scroll (drag,
  // scrollbar, wheel or trackpad) so it can be restored after a view switch.
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    scrollByView.current[viewMode] = { left: el.scrollLeft, top: el.scrollTop };
  }, [viewMode]);

  // Restore the saved scroll offset whenever the view changes — and re-apply
  // once the content lands (employee/dept counts go from 0 → N), since at
  // mount the canvas is empty and the scroll set would clamp to 0. We key the
  // re-apply on the counts (not the array identities) so it doesn't fire on
  // every render and fight the user's scrolling; `saved` already tracks the
  // user's live position via onScroll, so re-applying is a no-op after load.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const saved = scrollByView.current[viewMode];
    el.scrollLeft = saved.left;
    el.scrollTop = saved.top;
  }, [viewMode, employees.length, empHierarchy.length]);

  // Reset scroll to the home position when fitting / resetting zoom so the
  // chart re-centers. Otherwise you can end up "lost" after zooming out.
  const resetScroll = useCallback(() => {
    const el = canvasRef.current;
    if (el) {
      el.scrollLeft = STAGE_HOME;
      el.scrollTop = STAGE_HOME;
    }
    scrollByView.current[viewMode] = { left: STAGE_HOME, top: STAGE_HOME };
  }, [viewMode]);

  // Fit-to-screen: compute a zoom factor that scales the tree to fit inside
  // the visible canvas width AND reset pan so everything is centered.
  const handleFitToScreen = useCallback(() => {
    const el = canvasRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const available = el.clientWidth - 32;
    const naturalW = content.scrollWidth / zoom;
    const availableH = el.clientHeight - 32;
    const naturalH = content.scrollHeight / zoom;
    if (naturalW <= 0 || available <= 0) return;
    const ratioW = available / naturalW;
    const ratioH = availableH / naturalH;
    const next = Math.max(0.3, Math.min(1, Math.min(ratioW, ratioH)));
    setZoom(Number(next.toFixed(2)));
    resetScroll();
    // setZoom/resetScroll are per-view useCallbacks whose closures bake in
    // the current viewMode. If we depend on `zoom` only, switching to
    // a view with the same zoom value (e.g. both at 100%) won't trigger
    // recreation, and we'd keep the previous view's setters — Fit would
    // silently update the wrong view's slot. Including the setters in
    // the dep array forces the callback to refresh whenever viewMode
    // changes, regardless of zoom.
  }, [zoom, setZoom, resetScroll]);

  // Re-center on zoom reset for consistency with Fit button.
  const handleZoomResetFull = useCallback(() => {
    setZoom(1);
    resetScroll();
  }, [resetScroll, setZoom]);

  if (isLoading) {
    return (
      <div className={mainStyles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={mainStyles.emptyContainer}>
        <Empty description="No hierarchy data available. Ensure a company profile exists." />
      </div>
    );
  }

  const companyName = data.company?.legalName ?? data.company?.companyName ?? 'Company';
  const buList = data.businessUnits ?? [];
  const totalBUs = buList.length;
  const totalDepts = buList.reduce((sum, entry) => {
    const countDepts = (nodes: DepartmentNode[]): number =>
      nodes.reduce((s, n) => s + 1 + (n.children ? countDepts(n.children) : 0), 0);
    return sum + countDepts(entry.departments || []);
  }, 0);

  return (
    <div
      className={styles.chartWrapper}
      // Inline styles win over the CSS module, so the wrapper is guaranteed
      // to be a self-contained bounded box that doesn't leak width into the
      // ancestor tab pane / content holder.
      style={{
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        // Required so the absolutely-positioned zoom controls below
        // anchor to this wrapper, not bubble up to a far ancestor
        // (which would push them off-screen).
        position: 'relative',
      }}
    >
      {/* Toolbar — left side only (title + view switcher + tags). */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <ApartmentOutlined style={{ color: 'var(--hrm-accent, #1890ff)' }} />
          <span className={styles.toolbarTitle}>
            {forceViewMode === 'tree' ? 'Reporting Tree' : forceViewMode === 'org' ? 'Org Structure' : 'Organization Hierarchy'}
          </span>
          {!forceViewMode && (
            <Segmented<ViewMode>
              size="small"
              value={viewMode}
              onChange={(v) => setViewMode(v)}
              options={[
                { label: 'Org Structure', value: 'org' },
                { label: 'Reporting Tree', value: 'tree' },
              ]}
            />
          )}
          {viewMode === 'org' ? (
            <>
              <Tag color="blue">{totalBUs} BUs</Tag>
              <Tag color="purple">{totalDepts} Depts</Tag>
              <Tag color="cyan">{employees.length} Employees</Tag>
            </>
          ) : (
            <Tag color="cyan">{countHierarchy(empHierarchy)} Employees</Tag>
          )}
        </div>
      </div>

      {/* Zoom / Fit / 100% controls — floated absolutely at the top-right
          corner so they can never be pushed off-screen, hidden by
          chart-content overlap, or affected by Tabs/parent overflow.
          Inline styles + zIndex defeat any cascade-side gotcha. */}
      <div
        className={styles.toolbarActions}
        style={{
          position: 'absolute',
          top: 10,
          right: 16,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'var(--hrm-bg-white, #fff)',
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid var(--hrm-border-light, #f0f0f0)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={zoom <= 0.4} />
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={zoom >= 1.8} />
        <Tooltip title="Fit to screen">
          <Button size="small" icon={<FullscreenOutlined />} onClick={handleFitToScreen}>
            Fit
          </Button>
        </Tooltip>
        <Button size="small" onClick={handleZoomResetFull}>100%</Button>
      </div>

      {/* Chart Viewport — scrollable container. `overflow: auto` gives real
          X and Y scrollbars once the (zoom-scaled) content overflows; on top
          of that, drag-to-pan moves scrollLeft/scrollTop so grabbing and the
          scrollbars stay in sync. */}
      <div
        ref={canvasRef}
        className={styles.chartCanvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onScroll={handleScroll}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
          // `scroll` (not `auto`) so both the bottom (X) and right (Y)
          // scrollbars are always visible, not just while actively scrolling.
          overflow: 'scroll',
          boxSizing: 'border-box',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
          // Our pointer handler drives panning for both mouse and touch (by
          // setting scrollLeft/scrollTop), so disable the browser's own touch
          // panning to avoid double-scrolling. Wheel + scrollbar dragging are
          // unaffected and keep working natively.
          touchAction: 'none',
          position: 'relative',
        }}
      >
        {/* Stage — an oversized surface (tree + empty margin all around) so the
            tree can always be dragged/panned in every direction and the canvas
            reliably overflows on both axes (driving the X/Y scrollbars). */}
        <div
          className={styles.chartStage}
          style={{
            display: 'block',
            // content-box so the STAGE_PAD margin is added *around* the tree
            // rather than eating into it; width sizes to the tree.
            boxSizing: 'content-box',
            width: 'max-content',
            padding: STAGE_PAD,
          }}
        >
          <div
            ref={contentRef}
            className={styles.chartScroll}
            style={{
              // `block` + `width: max-content` makes this child as wide as its
              // content so the canvas's overflow-x reliably produces a
              // horizontal scrollbar for wide trees. (inline-block left the
              // layout ambiguous inside the tab pane and the X scrollbar never
              // showed — see OrgChart.module.css .chartScroll.)
              display: 'block',
              width: 'max-content',
              // Zoom = CSS scale; panning is handled by the canvas's native
              // scroll, so no translate() here.
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
            }}
          >
          {viewMode === 'org' ? (
            /* Root: Company → BUs → Depts → Employees (dept-scoped) */
            <ul className={styles.chartTree}>
              <li className={styles.chartNode}>
                <div className={`${styles.chartCard} ${styles.companyCard}`}>
                  <ShopOutlined className={styles.cardIcon} style={{ color: '#1890ff' }} />
                  <div className={styles.cardContent}>
                    <div className={styles.cardName}>{companyName}</div>
                    <div className={styles.cardCode}>
                      {data.company?.industryType || data.company?.industry || 'Root'}
                    </div>
                  </div>
                </div>

                {buList.length > 0 && (
                  <ul className={styles.chartChildren}>
                    {buList.map((entry) => {
                      const bu = entry.businessUnit;
                      const depts = entry.departments || [];

                      return (
                        <li key={bu.handle} className={styles.chartNode}>
                          <div className={`${styles.chartCard} ${styles.buCard}`}>
                            <BankOutlined className={styles.cardIcon} style={{ color: '#13c2c2' }} />
                            <div className={styles.cardContent}>
                              <div className={styles.cardName}>{bu.buName}</div>
                              <div className={styles.cardCode}>{bu.buCode}</div>
                            </div>
                            {depts.length > 0 && (
                              <span className={styles.childCount}>{depts.length}</span>
                            )}
                          </div>

                          {depts.length > 0 && (
                            <ul className={styles.chartChildren}>
                              {depts.map((dept) => (
                                <DeptCard
                                  key={dept.handle}
                                  dept={dept}
                                  depth={1}
                                  employeesByDept={employeesByDept}
                                />
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            </ul>
          ) : (
            /* Reporting Tree: backend employee hierarchy rendered directly */
            <ul className={styles.chartTree}>
              {empHierarchy.length === 0 ? (
                <li className={styles.chartNode}>
                  <Empty description="No employee hierarchy data" />
                </li>
              ) : (
                empHierarchy.map((root) => (
                  <HierarchyEmployeeNode
                    key={root.handle}
                    node={root}
                    photoByHandle={photoByHandle}
                    isRoot={true}
                  />
                ))
              )}
            </ul>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgHierarchyChart;
