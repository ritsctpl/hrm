'use client';

import React, { useCallback, useMemo } from 'react';
import { Tree, Select, Button, Spin, Empty } from 'antd';
import { PlusOutlined, ApartmentOutlined } from '@ant-design/icons';
import OrgSearchBar from '../molecules/OrgSearchBar';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { Department, DepartmentNode } from '../../types/domain.types';
import type { DepartmentTreeProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

interface AntTreeNode {
  key: string;
  title: React.ReactNode;
  children?: AntTreeNode[];
  isLeaf?: boolean;
}

function buildTreeData(nodes: DepartmentNode[]): AntTreeNode[] {
  return nodes.map((node) => ({
    key: node.handle,
    title: `${node.deptName} (${node.deptCode})`,
    children: node.children && node.children.length > 0 ? buildTreeData(node.children) : undefined,
    isLeaf: !node.children || node.children.length === 0,
  }));
}

function getAllKeys(nodes: DepartmentNode[]): string[] {
  const keys: string[] = [];
  const traverse = (items: DepartmentNode[]) => {
    for (const item of items) {
      keys.push(item.handle);
      if (item.children) traverse(item.children);
    }
  };
  traverse(nodes);
  return keys;
}

const DepartmentTree: React.FC<DepartmentTreeProps> = ({ onSelect, onAdd }) => {
  const {
    department,
    businessUnit,
    setDepartmentSearch,
    setDepartmentSelectedBu,
    setDepartmentExpandedKeys,
    fetchDepartments,
  } = useHrmOrganizationStore();

  const {
    hierarchy,
    isLoading,
    searchText,
    selectedBuHandle,
    expandedKeys,
    selected,
  } = department;

  const buOptions = useMemo(
    () =>
      businessUnit.list.map((bu) => ({
        label: `${bu.buName} (${bu.buCode})`,
        value: bu.handle,
      })),
    [businessUnit.list]
  );

  // Filter hierarchy by search
  const filteredHierarchy = useMemo(() => {
    if (!searchText) return hierarchy;
    const searchLower = searchText.toLowerCase();

    const filterNodes = (nodes: DepartmentNode[]): DepartmentNode[] => {
      return nodes.reduce<DepartmentNode[]>((acc, node) => {
        const matches =
          node.deptCode.toLowerCase().includes(searchLower) ||
          node.deptName.toLowerCase().includes(searchLower);
        const filteredChildren = node.children
          ? filterNodes(node.children)
          : [];

        if (matches || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children,
          });
        }
        return acc;
      }, []);
    };

    return filterNodes(hierarchy);
  }, [hierarchy, searchText]);

  const treeData = useMemo(() => buildTreeData(filteredHierarchy), [filteredHierarchy]);

  // Auto-expand all when searching
  const effectiveExpandedKeys = useMemo(() => {
    if (searchText) return getAllKeys(filteredHierarchy);
    return expandedKeys;
  }, [searchText, filteredHierarchy, expandedKeys]);

  const handleBuChange = useCallback(
    (buHandle: string) => {
      setDepartmentSelectedBu(buHandle);
      fetchDepartments(buHandle);
    },
    [setDepartmentSelectedBu, fetchDepartments]
  );

  const handleTreeSelect = useCallback(
    (selectedKeys: React.Key[]) => {
      if (selectedKeys.length === 0) return;
      const handle = selectedKeys[0] as string;
      const dept = department.list.find((d) => d.handle === handle);
      if (dept) {
        onSelect(dept);
      }
    },
    [department.list, onSelect]
  );

  const handleExpand = useCallback(
    (keys: React.Key[]) => {
      setDepartmentExpandedKeys(keys as string[]);
    },
    [setDepartmentExpandedKeys]
  );

  return (
    <div className={mainStyles.treeContainer}>
      <div className={mainStyles.treeHeader}>
        <div className={mainStyles.treeHeaderLeft}>
          <ApartmentOutlined style={{ color: '#1890ff' }} />
          <span className={mainStyles.listTitle}>Departments</span>
        </div>
        <Button
          type="primary"
          onClick={onAdd}
          disabled={!selectedBuHandle}
          size="small"
        >
          +
        </Button>
      </div>

      <div className={mainStyles.buFilter}>
        <Select
          value={selectedBuHandle || undefined}
          onChange={handleBuChange}
          options={buOptions}
          placeholder="Select Business Unit"
          style={{ width: '100%', marginBottom: 12 }}
          showSearch
          optionFilterProp="label"
        />
      </div>

      <OrgSearchBar
        value={searchText}
        onChange={setDepartmentSearch}
        placeholder="Search departments..."
      />

      <div style={{ marginTop: 12 }}>
        {isLoading ? (
          <div className={mainStyles.loadingContainer}>
            <Spin size="default" />
          </div>
        ) : !selectedBuHandle ? (
          <Empty description="Select a Business Unit to view departments" />
        ) : treeData.length === 0 ? (
          <Empty description="No departments found" />
        ) : (
          <Tree
            className={mainStyles.departmentTree}
            treeData={treeData}
            selectedKeys={selected ? [selected.handle] : []}
            expandedKeys={effectiveExpandedKeys}
            onSelect={handleTreeSelect}
            onExpand={handleExpand}
            showLine
            blockNode
          />
        )}
      </div>
    </div>
  );
};

export default DepartmentTree;
