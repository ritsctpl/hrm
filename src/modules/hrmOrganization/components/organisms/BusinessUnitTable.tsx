'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Table, Button, Spin, Popconfirm, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MdDelete } from 'react-icons/md';
import OrgStatusTag from '../atoms/OrgStatusTag';
import OrgSearchBar from '../molecules/OrgSearchBar';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { BusinessUnit } from '../../types/domain.types';
import type { BusinessUnitTableProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const BusinessUnitTable: React.FC<BusinessUnitTableProps> = ({ onSelect, onAdd }) => {
  const {
    businessUnit,
    setBusinessUnitSearch,
    deleteBusinessUnit,
  } = useHrmOrganizationStore();

  const { list, searchText, isLoading, selected } = businessUnit;
  const [tableHeight, setTableHeight] = useState<number>(500);

  // Calculate table height based on screen resolution
  useEffect(() => {
    const calculateTableHeight = () => {
      const screenHeight = window.innerHeight;
      const reservedHeight = 300;
      setTableHeight(Math.max(screenHeight - reservedHeight, 300));
    };

    calculateTableHeight();
    window.addEventListener('resize', calculateTableHeight);
    return () => window.removeEventListener('resize', calculateTableHeight);
  }, []);

  const filteredList = useMemo(() => {
    if (!searchText) return list;
    const searchLower = searchText.toLowerCase();
    return list.filter(
      (bu) =>
        bu.buCode.toLowerCase().includes(searchLower) ||
        bu.buName.toLowerCase().includes(searchLower)
    );
  }, [list, searchText]);

  const handleDelete = useCallback(
    async (handle: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await deleteBusinessUnit(handle);
        message.success('Business unit deleted successfully');
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to delete business unit';
        message.error(errorMsg);
      }
    },
    [deleteBusinessUnit]
  );

  const columns: ColumnsType<BusinessUnit> = useMemo(
    () => [
      {
        title: 'BU Code',
        dataIndex: 'buCode',
        key: 'buCode',
        sorter: (a, b) => a.buCode.localeCompare(b.buCode),
      },
      {
        title: 'BU Name',
        dataIndex: 'buName',
        key: 'buName',
        ellipsis: true,
        sorter: (a, b) => a.buName.localeCompare(b.buName),
      },
      {
        title: 'Department Count',
        dataIndex: 'departmentCount',
        key: 'departmentCount',
      },
      {
        title: 'Primary Contact',
        dataIndex: 'primaryContact',
        key: 'primaryContact',
        ellipsis: true,
      },
      {
        title: 'State',
        dataIndex: 'state',
        key: 'state',
      },
      // {
      //   title: 'Status',
      //   dataIndex: 'active',
      //   key: 'active',
      //   render: (active: number) => <OrgStatusTag active={active} />,
      // },
      {
        title: 'Action',
        key: 'actions',
        render: (_: unknown, record: BusinessUnit) => (
          <Popconfirm
            title="Delete Business Unit"
            description="Are you sure you want to delete this business unit?"
            onConfirm={(e) => handleDelete(record.handle, e as unknown as React.MouseEvent)}
            onCancel={(e) => e?.stopPropagation()}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<MdDelete />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        ),
      },
    ],
    [handleDelete]
  );

  if (isLoading) {
    return (
      <div className={mainStyles.loadingContainer}>
        <Spin size="large">
          <div style={{ minHeight: 100 }} />
        </Spin>
      </div>
    );
  }

  return (
    <div>
      <div className={mainStyles.listHeader}>
        <div className={mainStyles.listHeaderLeft}>
          <span className={mainStyles.listTitle}>Business Units</span>
          <OrgSearchBar
            value={searchText}
            onChange={setBusinessUnitSearch}
            placeholder="Search by code, name, or type..."
          />
        </div>
        <Button type="primary" onClick={onAdd}>
          +
        </Button>
      </div>

      <Table<BusinessUnit>
        columns={columns}
        dataSource={filteredList}
        rowKey="handle"
        size="small"
        pagination={false}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: {
            cursor: 'pointer',
            backgroundColor:
              selected?.handle === record.handle ? '#e6f4ff' : undefined,
          },
        })}
        scroll={{ y: tableHeight, x: 800 }}
        virtual
      />
    </div>
  );
};

export default BusinessUnitTable;
