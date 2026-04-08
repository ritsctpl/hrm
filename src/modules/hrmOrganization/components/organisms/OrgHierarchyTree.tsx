'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tree, Spin, Empty, Button } from 'antd';
import { ApartmentOutlined, NodeExpandOutlined, NodeCollapseOutlined } from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { OrgHierarchy, BusinessUnit } from '../../types/domain.types';
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
        {hierarchy.company?.legalName ?? hierarchy.company?.companyName ?? 'Company'}
      </strong>
    ),
    children: (hierarchy.businessUnits ?? []).map((entry) => {
      // API returns { businessUnit: {...}, departments: [...] }
      const bu = entry.businessUnit || (entry as unknown as BusinessUnit);
      const depts = entry.departments || (entry as unknown as Record<string, unknown>).departments;
      return {
        key: `bu-${bu.handle}`,
        title: `${bu.buName} (${bu.buCode})`,
        children:
          depts && (depts as DepartmentNode[]).length > 0
            ? buildDeptNodes(depts as DepartmentNode[])
            : undefined,
        isLeaf: !depts || (depts as DepartmentNode[]).length === 0,
      };
    }),
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
  }, [fetchHierarchy]);

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
  }, [treeData, allKeys, expandedKeys.length]);

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

  return (
    <div className={mainStyles.treeContainer}>
      <div className={mainStyles.treeHeader}>
        <div className={mainStyles.treeHeaderLeft}>
          <ApartmentOutlined style={{ color: '#1890ff' }} />
          <span className={mainStyles.listTitle}>Organization Hierarchy</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<NodeExpandOutlined />}
            onClick={handleExpandAll}
          >
            Expand All
          </Button>
          <Button
            size="small"
            icon={<NodeCollapseOutlined />}
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
