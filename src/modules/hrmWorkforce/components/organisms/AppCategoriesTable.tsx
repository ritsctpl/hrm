'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Popconfirm, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useCan } from '@/modules/hrmAccess/hooks/useCan';
import AppCategoryFormModal from './AppCategoryFormModal';
import { categoryColor, useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { AppCategory } from '../../types/api.types';
import { MODULE_CODE, OBJ } from '../../utils/workforceConstants';
import { fromNowSafe } from '../../utils/workforceFormat';
import styles from '../../styles/Workforce.module.css';

interface Props {
  /** Defaults to the hook's `loadAppCategories`; overridable so a template can refresh several slots at once. */
  onRefresh?: () => void;
}

/**
 * The App Categories tab: the pattern → category rules that roll raw app activity up into named
 * work categories.
 *
 * <b>The tab is EDIT-gated on the same object as Fleet.</b> `workforce_fleet` governs the estate and
 * its classification rules alike (the same object Office Networks uses), so Add / Edit / Deactivate
 * appear only for `canEdit`; a viewer sees the table and nothing that mutates it.
 *
 * <b>Self-loading, and only when the slot is empty.</b> Like Office Networks, this table fetches
 * itself on mount so it renders correctly whether or not a parent primes it. A populated slot is
 * left alone; the Refresh button is how a stale list is re-asked for, deliberately by hand.
 *
 * <b>Colour is a preset name, never a hex.</b> The category tag is coloured by the pure
 * `categoryColor` (an AntD preset name), so dark mode re-derives the shade rather than showing a
 * fixed light-mode colour on a dark surface.
 */
const AppCategoriesTable: React.FC<Props> = ({ onRefresh }) => {
  const rows = useHrmWorkforceStore((s) => s.appCategories);
  const loading = useHrmWorkforceStore((s) => s.appCategoriesLoading);
  const error = useHrmWorkforceStore((s) => s.error);
  const { loadAppCategories, deactivateAppCategory } = useHrmWorkforceData();
  const { canEdit } = useCan(MODULE_CODE, OBJ.FLEET);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppCategory | null>(null);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (row: AppCategory) => {
    setEditing(row);
    setModalOpen(true);
  };

  // First mount fetches the list when the slot is empty — a populated slot (a parent primed it, or
  // a previous mount already loaded it) is left as it is rather than re-asked for on every remount.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if ((useHrmWorkforceStore.getState().appCategories?.length ?? 0) === 0) void loadAppCategories();
    // Mount only: `loadAppCategories` is stable per site/actor, and depending on it would re-run
    // this on every render that produced a new callback identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<AppCategory> = [
    {
      title: 'Pattern',
      dataIndex: 'pattern',
      width: 260,
      ellipsis: true,
      sorter: (a, b) => (a.pattern ?? '').localeCompare(b.pattern ?? ''),
      render: (value: string) => <span className={styles.mono}>{value || '—'}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: 180,
      sorter: (a, b) => (a.category ?? '').localeCompare(b.category ?? ''),
      // Preset colour name (not hex) so dark mode re-derives the shade; the same category always
      // renders in the same colour so the eye can track it down the column.
      render: (value: string) => <Tag color={categoryColor(value)}>{value || '—'}</Tag>,
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
            title="Deactivate this rule?"
            description="Apps that matched it will roll up under 'Other'."
            okText="Deactivate"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={() => void deactivateAppCategory(row.id)}
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
        No app-category rules — every app currently reports under &apos;Other&apos;.
      </div>
      {error ? (
        <div className={styles.emptyError}>The last workforce request failed: {error}</div>
      ) : canEdit ? (
        <div className={styles.emptyHint}>
          Add a rule to classify an app by a substring of its name, e.g. chrome → Browsing.
        </div>
      ) : null}
    </div>
  );

  return (
    <div>
      <div className={styles.fleetBar}>
        <span className={styles.cellPrimary}>App categories</span>
        <div className={styles.fleetBarRight}>
          {canEdit ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Add rule
            </Button>
          ) : null}
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh ?? (() => void loadAppCategories())}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Table<AppCategory>
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
          showTotal: (count) => `${count} rule${count === 1 ? '' : 's'}`,
        }}
      />

      <AppCategoryFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default AppCategoriesTable;
