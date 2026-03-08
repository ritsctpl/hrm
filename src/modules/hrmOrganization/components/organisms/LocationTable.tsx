'use client';

import React, { useCallback, useMemo } from 'react';
import { Table, Button, Spin, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import OrgStatusTag from '../atoms/OrgStatusTag';
import OrgSearchBar from '../molecules/OrgSearchBar';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { Location } from '../../types/domain.types';
import type { LocationTableProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const LocationTable: React.FC<LocationTableProps> = ({ onSelect, onAdd }) => {
  const {
    location,
    setLocationSearch,
    deleteLocation,
  } = useHrmOrganizationStore();

  const { list, searchText, isLoading, selected } = location;

  const filteredList = useMemo(() => {
    if (!searchText) return list;
    const searchLower = searchText.toLowerCase();
    return list.filter(
      (loc) =>
        (loc.code?.toLowerCase() ?? '').includes(searchLower) ||
        (loc.name?.toLowerCase() ?? '').includes(searchLower) ||
        (loc.city?.toLowerCase() ?? '').includes(searchLower)
    );
  }, [list, searchText]);

  const handleDelete = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      await deleteLocation(id);
    },
    [deleteLocation]
  );

  const columns: ColumnsType<Location> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        width: 120,
        sorter: (a, b) => (a.code ?? '').localeCompare(b.code ?? ''),
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        sorter: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
      },
      {
        title: 'City',
        dataIndex: 'city',
        key: 'city',
        width: 130,
      },
      {
        title: 'State',
        dataIndex: 'state',
        key: 'state',
        width: 140,
      },
      {
        title: 'Country',
        dataIndex: 'country',
        key: 'country',
        width: 120,
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
        render: (_: unknown, record: Location) => (
          <Popconfirm
            title="Delete Location"
            description="Are you sure you want to delete this location?"
            onConfirm={(e) => handleDelete(record.id, e as unknown as React.MouseEvent)}
            onCancel={(e) => e?.stopPropagation()}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
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
        <Spin size="large" tip="Loading locations..." />
      </div>
    );
  }

  return (
    <div>
      <div className={mainStyles.listHeader}>
        <div className={mainStyles.listHeaderLeft}>
          <span className={mainStyles.listTitle}>Locations</span>
          <OrgSearchBar
            value={searchText}
            onChange={setLocationSearch}
            placeholder="Search by code, name, or city..."
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Location
        </Button>
      </div>

      <Table<Location>
        columns={columns}
        dataSource={filteredList}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `Total: ${total}` }}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: {
            cursor: 'pointer',
            backgroundColor:
              selected?.id === record.id ? '#e6f4ff' : undefined,
          },
        })}
        scroll={{ y: 'calc(100vh - 300px)' }}
      />
    </div>
  );
};

export default LocationTable;
