'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Popconfirm, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useCan } from '@/modules/hrmAccess/hooks/useCan';
import OfficeNetworkFormModal from './OfficeNetworkFormModal';
import { useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { OfficeNetwork } from '../../types/api.types';
import { MODULE_CODE, OBJ } from '../../utils/workforceConstants';
import { fromNowSafe } from '../../utils/workforceFormat';
import styles from '../../styles/Workforce.module.css';

interface Props {
  /** Defaults to the hook's `loadOfficeNetworks`; overridable so a template can refresh several slots at once. */
  onRefresh?: () => void;
}

/**
 * One of the three fingerprint lists as a wrapped strip of tags, or a muted em dash when the
 * dimension is not fingerprinted. An empty list is a legitimate "this network is not identified by
 * its MACs" (or BSSIDs, or IPs) — it renders as an absence, never as a blank cell that reads like a
 * missing value.
 */
const FingerprintTags: React.FC<{ values?: string[] }> = ({ values }) => {
  if (!values || values.length === 0) return <span className={styles.cellMuted}>—</span>;
  return (
    <span className={styles.tagList}>
      {values.map((value) => (
        <Tag key={value} className={styles.mono} style={{ marginInlineEnd: 0 }}>
          {value}
        </Tag>
      ))}
    </span>
  );
};

/**
 * The Office Networks tab: the network fingerprints that tell on-site activity from off-site.
 *
 * <b>The tab is EDIT-gated on the same object as Fleet.</b> `workforce_fleet` governs the estate and
 * its network registry alike, so Add / Edit / Deactivate appear only for `canEdit`; a viewer sees
 * the table and nothing that mutates it.
 *
 * <b>Self-loading, and only when the slot is empty.</b> Unlike Fleet and Attendance — which the
 * landing drives once on first activation — this table fetches itself on mount, mirroring the report
 * panels, so it renders correctly whether or not a parent primes it. A populated slot is left alone;
 * the Refresh button is how a stale list is re-asked for, deliberately by hand.
 *
 * <b>Colour is a preset name, never a hex.</b> The type tag is `green` for OFFICE and `blue` for
 * CLIENT by AntD preset, so dark mode re-derives the shade rather than showing a fixed light-mode
 * colour on a dark surface.
 */
const OfficeNetworksTable: React.FC<Props> = ({ onRefresh }) => {
  const rows = useHrmWorkforceStore((s) => s.officeNetworks);
  const loading = useHrmWorkforceStore((s) => s.officeNetworksLoading);
  const error = useHrmWorkforceStore((s) => s.error);
  const { loadOfficeNetworks, deactivateOfficeNetwork } = useHrmWorkforceData();
  const { canEdit } = useCan(MODULE_CODE, OBJ.FLEET);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OfficeNetwork | null>(null);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (row: OfficeNetwork) => {
    setEditing(row);
    setModalOpen(true);
  };

  // First mount fetches the list when the slot is empty — a populated slot (a parent primed it, or
  // a previous mount already loaded it) is left as it is rather than re-asked for on every remount.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if ((useHrmWorkforceStore.getState().officeNetworks?.length ?? 0) === 0) void loadOfficeNetworks();
    // Mount only: `loadOfficeNetworks` is stable per site/actor, and depending on it would re-run
    // this on every render that produced a new callback identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<OfficeNetwork> = [
    {
      title: 'Label',
      dataIndex: 'label',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => (a.label ?? '').localeCompare(b.label ?? ''),
      render: (_, row) => (
        <div style={{ minWidth: 0 }}>
          <div className={styles.cellPrimary}>{row.label || '—'}</div>
          {row.locationId ? (
            <div className={`${styles.cellSub} ${styles.mono}`}>{row.locationId}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'locationType',
      width: 110,
      render: (value: string) => {
        const type = (value || '').toUpperCase();
        // Preset colour names (not hex) so dark mode re-derives the shade; an unknown type falls
        // back to the neutral default rather than mislabelling itself as OFFICE or CLIENT.
        const color = type === 'OFFICE' ? 'green' : type === 'CLIENT' ? 'blue' : 'default';
        return <Tag color={color}>{type || '—'}</Tag>;
      },
    },
    {
      title: 'Gateway MACs',
      dataIndex: 'gatewayMacs',
      width: 220,
      render: (value: string[]) => <FingerprintTags values={value} />,
    },
    {
      title: 'BSSIDs',
      dataIndex: 'bssids',
      width: 220,
      render: (value: string[]) => <FingerprintTags values={value} />,
    },
    {
      title: 'Egress IPs',
      dataIndex: 'egressIps',
      width: 200,
      render: (value: string[]) => <FingerprintTags values={value} />,
    },
    {
      title: 'Active',
      dataIndex: 'active',
      width: 100,
      render: (value: boolean) =>
        value ? <Tag color="green">Active</Tag> : <Tag color="default">Inactive</Tag>,
    },
    {
      title: 'Last updated',
      key: 'updated',
      width: 170,
      render: (_, row) =>
        row.updatedAt || row.updatedBy ? (
          <div>
            <div className={styles.cellPrimary}>{fromNowSafe(row.updatedAt)}</div>
            <div className={styles.cellSub}>{row.updatedBy || '—'}</div>
          </div>
        ) : (
          <span className={styles.cellMuted}>—</span>
        ),
    },
  ];

  if (canEdit) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, row) => (
        <span className={styles.tagList}>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Popconfirm
            title="Deactivate this network?"
            description="Activity on it will no longer read as on-site."
            okText="Deactivate"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={() => void deactivateOfficeNetwork(row.id)}
          >
            <Button type="link" size="small" danger style={{ padding: 0 }}>
              Deactivate
            </Button>
          </Popconfirm>
        </span>
      ),
    });
  }

  const emptyText = (
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>
        No office networks configured — activity on an unregistered network reads as Home.
      </div>
      {error ? (
        <div className={styles.emptyError}>The last workforce request failed: {error}</div>
      ) : canEdit ? (
        <div className={styles.emptyHint}>
          Add a network to fingerprint a location by its gateway MACs, Wi-Fi BSSIDs or egress IPs.
        </div>
      ) : null}
    </div>
  );

  return (
    <div>
      <div className={styles.fleetBar}>
        <span className={styles.cellPrimary}>Office networks</span>
        <div className={styles.fleetBarRight}>
          {canEdit ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Add network
            </Button>
          ) : null}
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh ?? (() => void loadOfficeNetworks())}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Table<OfficeNetwork>
        // `id` is the registry handle and is unique; the index is the last resort so a row that
        // somehow arrived without one cannot collide with another and lose the second.
        rowKey={(row, index) => row.id || `row-${index ?? 0}`}
        size="small"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 360px)' }}
        pagination={{
          defaultPageSize: 20,
          size: 'small',
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (count) => `${count} network${count === 1 ? '' : 's'}`,
        }}
      />

      <OfficeNetworkFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default OfficeNetworksTable;
