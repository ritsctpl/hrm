'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tree, Button, Spin, Empty, Tag, Tooltip } from 'antd';
import { PlusOutlined, ApartmentOutlined, BankOutlined, ClearOutlined, EditOutlined } from '@ant-design/icons';
import OrgSearchBar from '../molecules/OrgSearchBar';
import Can from '../../../hrmAccess/components/Can';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import type { Department, DepartmentNode, BusinessUnit } from '../../types/domain.types';
import type { DepartmentTreeProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

interface AntTreeNode {
  key: string;
  title: React.ReactNode;
  children?: AntTreeNode[];
  isLeaf?: boolean;
  selectable?: boolean;
}

function buildDeptNodes(
  nodes: DepartmentNode[],
  onViewClick?: (dept: Department) => void,
): AntTreeNode[] {
  return nodes.map((node) => ({
    key: node.handle,
    // Selection is handled manually via the title onClick below. Ant Tree's
    // built-in onSelect is disabled per-node so it can't fight with our
    // explicit click routing.
    selectable: false,
    title: (
      <span
        onClick={(e) => {
          // Single-path UX: clicking a dept row opens the form in view
          // mode. The edit transition happens via the "Edit" button in
          // the form header (see onEnterEditMode in DepartmentTemplate).
          e.stopPropagation();
          if (onViewClick) onViewClick(node);
        }}
        style={{ cursor: 'pointer', display: 'inline-block', width: '100%' }}
      >
        {node.deptName} ({node.deptCode})
      </span>
    ),
    children:
      node.children && node.children.length > 0
        ? buildDeptNodes(node.children, onViewClick)
        : undefined,
    isLeaf: !node.children || node.children.length === 0,
  }));
}

function getAllDeptKeys(nodes: DepartmentNode[]): string[] {
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

function filterDeptNodes(nodes: DepartmentNode[], searchLower: string): DepartmentNode[] {
  return nodes.reduce<DepartmentNode[]>((acc, node) => {
    const matches =
      node.deptCode.toLowerCase().includes(searchLower) ||
      node.deptName.toLowerCase().includes(searchLower);
    const filteredChildren = node.children ? filterDeptNodes(node.children, searchLower) : [];

    if (matches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      });
    }
    return acc;
  }, []);
}

const DepartmentTree: React.FC<DepartmentTreeProps> = ({ onSelect, onEdit, onAdd }) => {
  const {
    department,
    businessUnit,
    setDepartmentSearch,
    setDepartmentSelectedBu,
    setDepartmentExpandedKeys,
    fetchDepartments,
    hierarchy: hierarchyState,
    fetchHierarchy,
  } = useHrmOrganizationStore();

  const permissions = useOrganizationPermissions();
  const {
    isLoading,
    searchText,
    selected,
    expandedKeys,
  } = department;

  // Fetch hierarchy data (contains all BUs with their departments)
  const [allBuDepts, setAllBuDepts] = useState<{ bu: BusinessUnit; depts: DepartmentNode[] }[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    if (hierarchyState.data) {
      const entries = (hierarchyState.data.businessUnits || []).map((entry) => ({
        bu: entry.businessUnit,
        depts: entry.departments || [],
      }));
      // Merge in any BU from businessUnit.list that the hierarchy response
      // omitted (typically: a freshly-created BU with zero departments,
      // some backends only return BUs that already have at least one
      // department). Without this, newly-created BUs are invisible in the
      // tree until they have a department, which blocks the user from
      // adding the first department under them.
      const seen = new Set(entries.map((e) => e.bu?.handle).filter(Boolean));
      for (const bu of businessUnit.list) {
        if (bu.handle && !seen.has(bu.handle)) {
          entries.push({ bu, depts: [] });
        }
      }
      // After a department save, hrmOrganizationStore refreshes the
      // BU-specific `department.hierarchy` for the active BU. The global
      // hierarchy endpoint (used above) is sometimes slow to reflect the
      // new dept due to backend caching/scoping. Override the matching
      // BU's depts with the freshest BU-scoped hierarchy when available.
      if (
        department.selectedBuHandle &&
        Array.isArray(department.hierarchy) &&
        department.hierarchy.length > 0
      ) {
        const idx = entries.findIndex(
          (e) => e.bu?.handle === department.selectedBuHandle,
        );
        if (idx >= 0) {
          entries[idx] = { ...entries[idx], depts: department.hierarchy };
        }
      }
      setAllBuDepts(entries);
    } else {
      setLoadingAll(true);
      fetchHierarchy().finally(() => setLoadingAll(false));
    }
  }, [hierarchyState.data, fetchHierarchy, businessUnit.list, department.selectedBuHandle, department.hierarchy]);

  // Locate the BU owning a given dept (needed so DepartmentForm knows which
  // BU context to load).
  const findParentBu = useCallback(
    (dept: Department) => {
      return allBuDepts.find(({ depts }) => {
        const findInDepts = (nodes: DepartmentNode[]): boolean =>
          nodes.some((n) => n.handle === dept.handle || (n.children && findInDepts(n.children)));
        return findInDepts(depts);
      });
    },
    [allBuDepts]
  );

  // View: open details in read-only mode.
  const handleViewClick = useCallback(
    (dept: Department) => {
      const parentBu = findParentBu(dept);
      if (parentBu) setDepartmentSelectedBu(parentBu.bu.handle);
      onSelect(dept);
    },
    [findParentBu, onSelect, setDepartmentSelectedBu]
  );

  // Edit: open directly in edit mode (parent template flips the flag).
  const handleEditClick = useCallback(
    (dept: Department) => {
      const parentBu = findParentBu(dept);
      if (parentBu) setDepartmentSelectedBu(parentBu.bu.handle);
      onEdit?.(dept);
    },
    [findParentBu, onEdit, setDepartmentSelectedBu]
  );

  // Build combined tree: BU → Departments grouped
  const treeData = useMemo(() => {
    const searchLower = searchText?.toLowerCase() || '';

    return allBuDepts
      .map(({ bu, depts }) => {
        const filteredDepts = searchLower ? filterDeptNodes(depts, searchLower) : depts;
        if (searchLower && filteredDepts.length === 0) return null;

        return {
          key: `bu-${bu.handle}`,
          title: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <BankOutlined style={{ color: '#13c2c2', fontSize: 13 }} />
              <strong>{bu.buName}</strong>
              <Tag style={{ fontSize: 10, lineHeight: '16px', marginLeft: 4 }}>{bu.buCode}</Tag>
              <span style={{ color: '#8c8c8c', fontSize: 11 }}>({filteredDepts.length} depts)</span>
            </span>
          ),
          selectable: false,
          children: buildDeptNodes(filteredDepts, handleViewClick),
        } as AntTreeNode;
      })
      .filter(Boolean) as AntTreeNode[];
  }, [allBuDepts, searchText, handleViewClick]);

  // Collect all keys for expand-all when searching
  const allKeys = useMemo(() => {
    const keys: string[] = [];
    allBuDepts.forEach(({ bu, depts }) => {
      keys.push(`bu-${bu.handle}`);
      keys.push(...getAllDeptKeys(depts));
    });
    return keys;
  }, [allBuDepts]);

  const effectiveExpandedKeys = useMemo(() => {
    if (searchText) return allKeys;
    // Default: expand all BU-level nodes so departments are visible
    if (expandedKeys.length === 0) return allBuDepts.map(({ bu }) => `bu-${bu.handle}`);
    return expandedKeys;
  }, [searchText, expandedKeys, allKeys, allBuDepts]);

  // Find all departments flat for selection lookup
  const allDeptsList = useMemo(() => {
    const list: Department[] = [];
    const collect = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        list.push(n);
        if (n.children) collect(n.children);
      });
    };
    allBuDepts.forEach(({ depts }) => collect(depts));
    return list;
  }, [allBuDepts]);

  const handleTreeSelect = useCallback(
    (selectedKeys: React.Key[]) => {
      if (selectedKeys.length === 0) return;
      const handle = selectedKeys[0] as string;
      if (handle.startsWith('bu-')) return; // BU node — not selectable
      const dept = allDeptsList.find((d) => d.handle === handle);
      if (dept) {
        // Also set the BU context so save knows which BU
        const parentBu = allBuDepts.find(({ depts }) => {
          const findInDepts = (nodes: DepartmentNode[]): boolean =>
            nodes.some((n) => n.handle === handle || (n.children && findInDepts(n.children)));
          return findInDepts(depts);
        });
        if (parentBu) {
          setDepartmentSelectedBu(parentBu.bu.handle);
        }
        onSelect(dept);
      }
    },
    [allDeptsList, allBuDepts, onSelect, setDepartmentSelectedBu]
  );

  const handleExpand = useCallback(
    (keys: React.Key[]) => {
      setDepartmentExpandedKeys(keys as string[]);
    },
    [setDepartmentExpandedKeys]
  );

  const handleAdd = useCallback(() => {
    // If only one BU, auto-select it for the new department
    if (allBuDepts.length === 1) {
      setDepartmentSelectedBu(allBuDepts[0].bu.handle);
    }
    onAdd();
  }, [allBuDepts, setDepartmentSelectedBu, onAdd]);

  const isLoadingAll = isLoading || loadingAll;

  return (
    <div className={mainStyles.treeContainer}>
      <div className={mainStyles.treeHeader}>
        <div className={mainStyles.treeHeaderLeft}>
          <ApartmentOutlined style={{ color: '#1890ff' }} />
          <span className={mainStyles.listTitle}>Departments</span>
          {allBuDepts.length > 0 && (
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
              {allBuDepts.length} BUs · {allDeptsList.length} Depts
            </span>
          )}
        </div>
        <Can I="add">
          <Button type="primary" onClick={handleAdd} size="small" icon={<PlusOutlined />}>
            Add
          </Button>
        </Can>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <OrgSearchBar
            value={searchText}
            onChange={setDepartmentSearch}
            placeholder="Search departments across all BUs..."
          />
        </div>
        {searchText && (
          <Tooltip title="Clear search">
            <Button size="small" icon={<ClearOutlined />} onClick={() => setDepartmentSearch('')}>
              Reset
            </Button>
          </Tooltip>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        {isLoadingAll ? (
          <div className={mainStyles.loadingContainer}>
            <Spin size="default" />
          </div>
        ) : treeData.length === 0 ? (
          <Empty description={searchText ? 'No departments match your search' : 'No departments found. Create business units first.'} />
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
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>
    </div>
  );
};

export default DepartmentTree;
