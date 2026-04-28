'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseCookies } from 'nookies';
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
  const photo = emp.photoUrl;
  return (
    <div className={`${styles.chartCard} ${styles.employeeCard}`}>
      <div
        className={`${styles.empRoleHeader} ${isHead ? styles.empRoleHeaderHead : ''}`}
      >
        {emp.role || 'EMPLOYEE'}
      </div>
      <div className={styles.empBody}>
        {photo ? (
          <Avatar src={photo} size={48} />
        ) : (
          <Avatar size={48} icon={<UserOutlined />} />
        )}
        <div className={styles.empName}>{emp.fullName}</div>
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

  const [zoom, setZoom] = useState(1);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('org');
  const viewMode: ViewMode = forceViewMode ?? internalViewMode;
  const setViewMode = setInternalViewMode;
  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [empHierarchy, setEmpHierarchy] = useState<EmployeeHierarchyNode[]>([]);

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
    const cookies = parseCookies();
    const organizationId = getOrganizationId();
    if (!organizationId || !orgName) return;
    let cancelled = false;
    Promise.all([
      HrmEmployeeService.fetchDirectory({ organizationId, page: 0, size: 500 }).catch(
        () => ({ employees: [] } as { employees: EmployeeDirectoryRow[] }),
      ),
      HrmEmployeeService.fetchEmployeeHierarchy(organizationId, orgName).catch(
        () => [] as EmployeeHierarchyNode[],
      ),
    ]).then(([dirRes, hier]) => {
      if (cancelled) return;
      setEmployees((dirRes?.employees || []) as EmployeeDirectoryRow[]);
      setEmpHierarchy(hier || []);
    });
    return () => {
      cancelled = true;
    };
  }, [orgName]);

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
      if (emp.photoUrl) map[emp.handle] = emp.photoUrl;
    }
    return map;
  }, [employees]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleZoomReset = () => setZoom(1);

  // Transform-based pan. We track an (x, y) offset and apply it via CSS
  // `translate()` on the inner content. This is Miro / Figma / Google Maps
  // style panning — decoupled from overflow/scrollbar behaviour entirely.
  // The outer canvas keeps `overflow: hidden` so content outside the
  // viewport is clipped; dragging slides the inner content under it.
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;
    const el = canvasRef.current;
    if (!el) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  }, [pan.x, pan.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({
      x: dragState.current.startPanX + dx,
      y: dragState.current.startPanY + dy,
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    setIsDragging(false);
    const el = canvasRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }, []);

  // Reset pan when switching view mode or resetting zoom so the chart
  // re-centers. Otherwise you can end up "lost" after zooming out.
  const resetPan = useCallback(() => setPan({ x: 0, y: 0 }), []);

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
    setPan({ x: 0, y: 0 });
  }, [zoom]);

  // Re-center on zoom reset for consistency with Fit button.
  const handleZoomResetFull = useCallback(() => {
    setZoom(1);
    resetPan();
  }, [resetPan]);

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
      }}
    >
      {/* Toolbar */}
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
        <div className={styles.toolbarActions}>
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
      </div>

      {/* Chart Viewport — clip-only container. The inner content is panned
          by CSS transform, so we don't need overflow:auto scrollbars at all.
          This avoids every CSS cascade / ancestor-overflow pitfall. */}
      <div
        ref={canvasRef}
        className={styles.chartCanvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
          touchAction: 'none',
          position: 'relative',
        }}
      >
        <div
          ref={contentRef}
          className={styles.chartScroll}
          style={{
            display: 'inline-block',
            // Pan = translate; zoom = CSS scale (keeps layout math simple).
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            // Unset width constraint — inline-block sizes to content.
            width: 'auto',
            minWidth: '100%',
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
  );
};

export default OrgHierarchyChart;
