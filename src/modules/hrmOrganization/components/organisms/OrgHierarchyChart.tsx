'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Spin, Empty, Button, Tag, Tooltip } from 'antd';
import {
  ApartmentOutlined,
  BankOutlined,
  TeamOutlined,
  ShopOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { OrgHierarchy, DepartmentNode } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import styles from '../../styles/OrgChart.module.css';

/* ------------------------------------------------------------------ */
/*  Dept card — recursive                                              */
/* ------------------------------------------------------------------ */
const DeptCard: React.FC<{ dept: DepartmentNode; depth: number }> = ({ dept, depth }) => {
  const hasChildren = dept.children && dept.children.length > 0;
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
            <div className={styles.cardCode}>{dept.deptCode}</div>
          </div>
          {hasChildren && (
            <span className={styles.childCount}>
              {collapsed ? `+${dept.children!.length}` : '−'}
            </span>
          )}
        </div>
      </Tooltip>

      {hasChildren && !collapsed && (
        <ul className={styles.chartChildren}>
          {dept.children!.map((child) => (
            <DeptCard key={child.handle} dept={child} depth={depth + 1} />
          ))}
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

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

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
                              <DeptCard key={dept.handle} dept={dept} depth={1} />
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
