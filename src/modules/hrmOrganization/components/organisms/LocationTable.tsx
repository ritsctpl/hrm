'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Spin, Popconfirm, Tooltip, Tag, Collapse, Empty } from 'antd';
import {
  DeleteOutlined,
  ClearOutlined,
  EnvironmentOutlined,
  BankOutlined,
  ShopOutlined,
  PlusOutlined,
} from '@ant-design/icons';
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

  // Search filter — compare against code, name, and city so users can locate
  // entries regardless of which panel they live in.
  const filteredList = useMemo(() => {
    if (!searchText) return mergedRows;
    const q = searchText.toLowerCase();
    return mergedRows.filter(
      (loc) =>
        (loc.code?.toLowerCase() ?? '').includes(q) ||
        (loc.name?.toLowerCase() ?? '').includes(q) ||
        (loc.city?.toLowerCase() ?? '').includes(q)
    );
  }, [mergedRows, searchText]);

  // Group rows by (city, state) — handles cities with the same name in
  // different states (e.g. Hyderabad in Telangana vs Pakistan-border older
  // records). Empty-city rows bucket under "Unassigned".
  const groupedByCity = useMemo(() => {
    const groups = new Map<string, { city: string; state: string; country: string; rows: LocationRow[] }>();
    for (const row of filteredList) {
      const city = (row.city || '').trim() || 'Unassigned';
      const state = (row.state || '').trim();
      const country = (row.country || '').trim();
      const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(key, { city, state, country, rows: [row] });
      }
    }
    // Alphabetise by city name for a stable, predictable panel order.
    return Array.from(groups.values()).sort((a, b) =>
      a.city.localeCompare(b.city, undefined, { sensitivity: 'base' })
    );
  }, [filteredList]);

  const [activePanelKeys, setActivePanelKeys] = useState<string[]>([]);

  // One-time initialization: expand all panels on first load so the view
  // doesn't appear empty. A ref guard ensures user-initiated collapse of
  // every panel isn't undone on the next render by a "if empty → reopen all"
  // heuristic (which would make the Collapse behave erratically, like
  // re-expanding panels the user just closed).
  const panelsInitializedRef = useRef(false);
  useEffect(() => {
    if (panelsInitializedRef.current) return;
    if (groupedByCity.length === 0) return;
    setActivePanelKeys(groupedByCity.map((g) => `${g.city}|${g.state}`));
    panelsInitializedRef.current = true;
  }, [groupedByCity]);

  // When a search is active, auto-expand every matching panel so the user
  // immediately sees what matched without hunting through collapsed sections.
  // User's own open/close state is preserved the moment search clears.
  const effectiveActiveKeys = useMemo(() => {
    if (searchText) return groupedByCity.map((g) => `${g.city}|${g.state}`);
    return activePanelKeys;
  }, [searchText, activePanelKeys, groupedByCity]);

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

  const renderCard = useCallback(
    (row: LocationRow) => {
      const isBU = row.__source === 'bu';
      const isSelected = selected?.id === row.id;
      return (
        <div
          key={row.id}
          onClick={() => {
            // BU-derived rows are virtual — don't open the detail form.
            if (isBU) return;
            onSelect(row);
          }}
          style={{
            border: isSelected ? '2px solid var(--hrm-accent, #1890ff)' : '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 12,
            background: '#fff',
            cursor: isBU ? 'default' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 220,
            maxWidth: 280,
            flex: '1 1 240px',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: isSelected ? '0 2px 8px rgba(24,144,255,0.12)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (!isBU && !isSelected) {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#bae0ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!isBU && !isSelected) {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#f0f0f0';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {isBU ? (
                <BankOutlined style={{ color: '#13c2c2', flexShrink: 0 }} />
              ) : (
                <ShopOutlined style={{ color: '#1890ff', flexShrink: 0 }} />
              )}
              <strong
                style={{
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={row.name}
              >
                {row.name}
              </strong>
            </div>
            {permissions.canDeleteLocation && !isBU && (
              <Popconfirm
                title="Delete Location"
                description="Are you sure you want to delete this location?"
                onConfirm={(e) => handleDelete(row.id, e as unknown as React.MouseEvent)}
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
            )}
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{row.code}</div>
          <div style={{ fontSize: 12, color: '#595959', minHeight: 34 }}>
            {row.addressLine1 || <span style={{ color: '#bfbfbf' }}>No street address</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>{row.pincode || '—'}</span>
            <OrgStatusTag active={row.active ?? 1} />
            {isBU && (
              <Tag color="blue" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                From BU
              </Tag>
            )}
          </div>
        </div>
      );
    },
    [handleDelete, onSelect, permissions.canDeleteLocation, selected?.id]
  );

  if (isLoading) {
    return (
      <div className={mainStyles.loadingContainer}>
        <Spin size="large" tip="Loading locations..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div className={mainStyles.listHeader}>
        <div className={mainStyles.listHeaderLeft}>
          <span className={mainStyles.listTitle}>Locations</span>
          {mergedRows.length > 0 && (
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
              {groupedByCity.length} {groupedByCity.length === 1 ? 'city' : 'cities'} ·{' '}
              {mergedRows.length} {mergedRows.length === 1 ? 'unit' : 'units'}
            </span>
          )}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            Add
          </Button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', minHeight: 0 }}>
        {groupedByCity.length === 0 ? (
          <Empty
            description={
              searchText
                ? 'No locations match your search'
                : 'No locations yet. Add a Business Unit with an address, or create a manual location.'
            }
            style={{ marginTop: 48 }}
          />
        ) : (
          <Collapse
            activeKey={effectiveActiveKeys}
            onChange={(keys) => {
              // Ant can pass string | string[] | number[] depending on props.
              // Normalise to a string array so our state shape stays predictable.
              if (Array.isArray(keys)) {
                setActivePanelKeys(keys.map(String));
              } else if (keys === undefined || keys === null || keys === '') {
                setActivePanelKeys([]);
              } else {
                setActivePanelKeys([String(keys)]);
              }
            }}
            ghost
            items={groupedByCity.map((group) => {
              const panelKey = `${group.city}|${group.state}`;
              const locationLabel = [group.city, group.state, group.country]
                .filter(Boolean)
                .join(', ');
              return {
                key: panelKey,
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    <strong>{group.city}</strong>
                    {group.state && (
                      <span style={{ color: '#8c8c8c', fontSize: 12 }}>{group.state}</span>
                    )}
                    <Tag style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
                      {group.rows.length} {group.rows.length === 1 ? 'unit' : 'units'}
                    </Tag>
                  </span>
                ),
                children: (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: '0 8px 8px',
                    }}
                    title={locationLabel}
                  >
                    {group.rows.map(renderCard)}
                  </div>
                ),
              };
            })}
          />
        )}
      </div>
    </div>
  );
};

export default LocationTable;
