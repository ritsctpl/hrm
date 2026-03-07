'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tree, Spin, Empty, Button } from 'antd';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { OrgHierarchy } from '../../types/domain.types';
import type { DepartmentNode } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

interface AntTreeNode {
  key: string;
  title: React.ReactNode;
  children?: AntTreeNode[];
  isLeaf?: boolean;
}

function buildDeptNodes(departments: DepartmentNode[]): AntTreeNode[] {
  return departments.map((dept) => ({
    key: `dept-${dept.handle}`,
    title: `${dept.deptName} (${dept.deptCode})`,
    children:
      dept.children && dept.children.length > 0
        ? buildDeptNodes(dept.children)
        : undefined,
    isLeaf: !dept.children || dept.children.length === 0,
  }));
}

function buildTreeData(hierarchy: OrgHierarchy): AntTreeNode[] {
  const companyNode: AntTreeNode = {
    key: `company-${hierarchy.company?.handle ?? 'root'}`,
    title: (
      <strong>
        {hierarchy.company?.legalName ?? hierarchy.company?.tradeName ?? 'Company'}
      </strong>
    ),
    children: (hierarchy.businessUnits ?? []).map((bu) => ({
      key: `bu-${bu.handle}`,
      title: `${bu.buName} (${bu.buCode})`,
      children:
        bu.departments && bu.departments.length > 0
          ? buildDeptNodes(bu.departments as unknown as DepartmentNode[])
          : undefined,
      isLeaf: !bu.departments || bu.departments.length === 0,
    })),
  };

  return [companyNode];
}

function collectAllKeys(nodes: AntTreeNode[]): string[] {
  const keys: string[] = [];
  const traverse = (items: AntTreeNode[]) => {
    for (const item of items) {
      keys.push(item.key as string);
      if (item.children) traverse(item.children);
    }
  };
  traverse(nodes);
  return keys;
}

const OrgHierarchyTree: React.FC = () => {
  const { hierarchy, fetchHierarchy } = useHrmOrganizationStore();
  const { data, isLoading } = hierarchy;

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchHierarchy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const treeData = useMemo(() => {
    if (!data) return [];
    return buildTreeData(data);
  }, [data]);

  const allKeys = useMemo(() => collectAllKeys(treeData), [treeData]);

  // Auto-expand all on first load
  useEffect(() => {
    if (treeData.length > 0 && expandedKeys.length === 0) {
      setExpandedKeys(allKeys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData]);

  const handleExpandAll = useCallback(() => {
    setExpandedKeys(allKeys);
  }, [allKeys]);

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  const handleExpand = useCallback((keys: React.Key[]) => {
    setExpandedKeys(keys as string[]);
  }, []);

  if (isLoading) {
    return (
      <div className={mainStyles.loadingContainer}>
        <Spin size="large" tip="Loading organization hierarchy..." />
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

  return (
    <div className={mainStyles.treeContainer}>
      <div className={mainStyles.treeHeader}>
        <div className={mainStyles.treeHeaderLeft}>
          <AccountTreeIcon fontSize="small" style={{ color: '#1890ff' }} />
          <span className={mainStyles.listTitle}>Organization Hierarchy</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<UnfoldMoreIcon fontSize="small" />}
            onClick={handleExpandAll}
          >
            Expand All
          </Button>
          <Button
            size="small"
            icon={<UnfoldLessIcon fontSize="small" />}
            onClick={handleCollapseAll}
          >
            Collapse
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {treeData.length === 0 ? (
          <Empty description="No hierarchy data found" />
        ) : (
          <Tree
            className={mainStyles.departmentTree}
            treeData={treeData}
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            showLine
            blockNode
            selectable={false}
          />
        )}
      </div>
    </div>
  );
};

export default OrgHierarchyTree;
