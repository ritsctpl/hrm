'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Table, Button, Spin, Popconfirm, Tooltip, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import OrgStatusTag from '../atoms/OrgStatusTag';
import OrgSearchBar from '../molecules/OrgSearchBar';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import type { Location } from '../../types/domain.types';
import type { LocationTableProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

/** Derived-from-BU location rows carry a marker so we can disable their
 *  row actions (they don't correspond to real Location records). */
interface LocationRow extends Location {
  __source?: 'bu' | 'location';
  __sourceLabel?: string;
}

const LocationTable: React.FC<LocationTableProps> = ({ onSelect, onAdd }) => {
  const {
    location,
    businessUnit,
    setLocationSearch,
    deleteLocation,
  } = useHrmOrganizationStore();

  const permissions = useOrganizationPermissions();
  const { list, searchText, isLoading, selected } = location;

  // Auto-populate the Locations view from Business Unit addresses so the
  // user doesn't have to re-enter them. Real Locations (user-created) take
  // precedence: if a manual Location shares the same (city, pincode) key as
  // a BU-derived one, the manual record wins.
  const buDerivedRows: LocationRow[] = useMemo(() => {
    return (businessUnit.list || [])
      .filter((bu) => !!bu.address && !!(bu.address.line1 || bu.address.city))
      .map((bu) => {
        const addr = bu.address!;
        return {
          id: `bu::${bu.handle}`,
          site: bu.site,
          code: `BU-${bu.buCode}`,
          name: bu.buName,
          addressLine1: addr.line1 || '',
          addressLine2: null,
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || 'India',
          pincode: addr.pincode || '',
          active: bu.active ?? 1,
          __source: 'bu',
          __sourceLabel: bu.buName,
        } as LocationRow;
      });
  }, [businessUnit.list]);

  const mergedRows: LocationRow[] = useMemo(() => {
    const manual: LocationRow[] = (list || []).map((l) => ({
      ...l,
      __source: 'location',
    }));
    // De-duplicate: drop BU-derived rows when a manual Location matches on
    // (city, pincode) — user has already captured it explicitly.
    const manualKey = new Set(
      manual.map((m) => `${(m.city || '').toLowerCase()}|${m.pincode || ''}`)
    );
    const dedupedBu = buDerivedRows.filter(
      (b) => !manualKey.has(`${(b.city || '').toLowerCase()}|${b.pincode || ''}`)
    );
    return [...manual, ...dedupedBu];
  }, [list, buDerivedRows]);
  const [tableHeight, setTableHeight] = useState<number>(500);

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
    if (!searchText) return mergedRows;
    const searchLower = searchText.toLowerCase();
    return mergedRows.filter(
      (loc) =>
        (loc.code?.toLowerCase() ?? '').includes(searchLower) ||
        (loc.name?.toLowerCase() ?? '').includes(searchLower) ||
        (loc.city?.toLowerCase() ?? '').includes(searchLower)
    );
  }, [mergedRows, searchText]);

  const handleDelete = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await deleteLocation(id);
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to delete location';
        console.error('Delete error:', errorMsg);
      }
    },
    [deleteLocation]
  );

  const columns: ColumnsType<LocationRow> = useMemo(
    () => {
      const baseColumns: ColumnsType<LocationRow> = [
        {
          title: 'Code',
          dataIndex: 'code',
          key: 'code',
          sorter: (a, b) => (a.code ?? '').localeCompare(b.code ?? ''),
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          ellipsis: true,
          sorter: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
          render: (text: string, record: LocationRow) =>
            record.__source === 'bu' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {text}
                <Tag color="blue" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                  From BU
                </Tag>
              </span>
            ) : (
              text
            ),
        },
        {
          title: 'City',
          dataIndex: 'city',
          key: 'city',
        },
        {
          title: 'Pincode',
          dataIndex: 'pincode',
          key: 'pincode',
        },
        {
          title: 'State',
          dataIndex: 'state',
          key: 'state',
        },
        {
          title: 'Country',
          dataIndex: 'country',
          key: 'country',
        },
        {
          title: 'Status',
          dataIndex: 'active',
          key: 'active',
          render: (active: number) => <OrgStatusTag active={active} />,
        },
      ];

      // Only add Action column if user has DELETE permission. BU-derived rows
      // show no delete action — they're virtual, delete them via the BU tab.
      if (permissions.canDeleteLocation) {
        baseColumns.push({
          title: 'Action',
          key: 'actions',
          width: 80,
          render: (_: unknown, record: LocationRow) => {
            if (record.__source === 'bu') {
              return (
                <Tooltip title="This location is derived from a Business Unit. Edit it from the BU tab.">
                  <span style={{ color: '#bfbfbf', fontSize: 12 }}>—</span>
                </Tooltip>
              );
            }
            return (
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
            );
          },
        });
      }

      return baseColumns;
    },
    [handleDelete, permissions.canDeleteLocation]
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
          {searchText && (
            <Tooltip title="Clear search">
              <Button size="small" icon={<ClearOutlined />} onClick={() => setLocationSearch('')}>
                Reset
              </Button>
            </Tooltip>
          )}
        </div>
        {permissions.canAddLocation && (
          <Button type="primary" onClick={onAdd}>
            +
          </Button>
        )}
      </div>

      <Table<LocationRow>
        columns={columns}
        dataSource={filteredList}
        rowKey="id"
        size="small"
        pagination={false}
        onRow={(record) => ({
          onClick: () => {
            // BU-derived rows are virtual — don't open the edit form.
            if (record.__source === 'bu') return;
            onSelect(record);
          },
          style: {
            cursor: record.__source === 'bu' ? 'default' : 'pointer',
            backgroundColor:
              selected?.id === record.id ? 'var(--hrm-bg-active)' : undefined,
          },
        })}
        scroll={{ y: tableHeight, x: 800 }}
        virtual
      />
    </div>
  );
};

export default LocationTable;
