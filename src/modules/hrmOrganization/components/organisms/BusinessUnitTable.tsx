'use client';

import React, { useCallback, useMemo } from 'react';
import { Table, Button, Spin, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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

  const filteredList = useMemo(() => {
    if (!searchText) return list;
    const searchLower = searchText.toLowerCase();
    return list.filter(
      (bu) =>
        bu.buCode.toLowerCase().includes(searchLower) ||
        bu.buName.toLowerCase().includes(searchLower) ||
        bu.buType.toLowerCase().includes(searchLower)
    );
  }, [list, searchText]);

  const handleDelete = useCallback(
    async (handle: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      await deleteBusinessUnit(handle);
    },
    [deleteBusinessUnit]
  );

  const columns: ColumnsType<BusinessUnit> = useMemo(
    () => [
      {
        title: 'BU Code',
        dataIndex: 'buCode',
        key: 'buCode',
        width: 120,
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
        title: 'Type',
        dataIndex: 'buType',
        key: 'buType',
        width: 120,
      },
      {
        title: 'City',
        dataIndex: 'city',
        key: 'city',
        width: 120,
      },
      {
        title: 'State',
        dataIndex: 'state',
        key: 'state',
        width: 140,
      },
      {
        title: 'Status',
        dataIndex: 'active',
        key: 'active',
        width: 90,
        render: (active: number) => <OrgStatusTag active={active} />,
      },
      {
        title: '',
        key: 'actions',
        width: 50,
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
                icon={<DeleteIcon fontSize="small" />}
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
        <Spin size="large" tip="Loading business units..." />
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
        <Button type="primary" icon={<AddIcon fontSize="small" />} onClick={onAdd}>
          Add Business Unit
        </Button>
      </div>

      <Table<BusinessUnit>
        columns={columns}
        dataSource={filteredList}
        rowKey="handle"
        size="small"
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `Total: ${total}` }}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: {
            cursor: 'pointer',
            backgroundColor:
              selected?.handle === record.handle ? '#e6f4ff' : undefined,
          },
        })}
        scroll={{ y: 'calc(100vh - 300px)' }}
      />
    </div>
  );
};

export default BusinessUnitTable;
