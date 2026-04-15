'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { parseCookies } from 'nookies';
import { Spin, Empty, Button, Tag, Tooltip, Avatar } from 'antd';
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
import type { EmployeeDirectoryRow } from '../../../hrmEmployee/types/api.types';
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
const OrgHierarchyChart: React.FC = () => {
  const { hierarchy, fetchHierarchy } = useHrmOrganizationStore();
  const { data, isLoading } = hierarchy;

  const [zoom, setZoom] = useState(1);
  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // Fetch all employees once for grouping under departments. Uses the
  // standard directory endpoint with no filters; the API caps results
  // server-side, so this stays cheap.
  useEffect(() => {
    const cookies = parseCookies();
    const site = cookies.site || '';
    if (!site) return;
    let cancelled = false;
    HrmEmployeeService.fetchDirectory({ site, page: 0, size: 500 })
      .then((res) => {
        if (cancelled) return;
        setEmployees((res?.employees || []) as EmployeeDirectoryRow[]);
      })
      .catch(() => {
        if (cancelled) return;
        setEmployees([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleZoomReset = () => setZoom(1);

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
    <div className={styles.chartWrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <ApartmentOutlined style={{ color: 'var(--hrm-accent, #1890ff)' }} />
          <span className={styles.toolbarTitle}>Organization Hierarchy</span>
          <Tag color="blue">{totalBUs} BUs</Tag>
          <Tag color="purple">{totalDepts} Depts</Tag>
          <Tag color="cyan">{employees.length} Employees</Tag>
        </div>
        <div className={styles.toolbarActions}>
          <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={zoom <= 0.4} />
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={zoom >= 1.8} />
          <Button size="small" icon={<FullscreenOutlined />} onClick={handleZoomReset} />
        </div>
      </div>

      {/* Chart Canvas — pan + zoom */}
      <div className={styles.chartCanvas}>
        <div
          className={styles.chartScroll}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {/* Root: Company */}
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
        </div>
      </div>
    </div>
  );
};

export default OrgHierarchyChart;
