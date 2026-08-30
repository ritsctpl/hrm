'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button, Drawer, Input, Popconfirm, Spin, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PaymentsIcon from '@mui/icons-material/Payments';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import type { PayComponent } from '../../types/domain.types';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import { describeCalculation, isStatutory, countStructureUsage } from '../../utils/componentCalcLabel';
import PayComponentForm from './PayComponentForm';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';

const typeColor = (t: PayComponent['componentType']): string =>
  t === 'EARNING' ? 'green' : t === 'DEDUCTION' ? 'volcano' : 'gold';

const PayComponentsTable: React.FC = () => {
  const payComponents = useHrmCompensationStore((s) => s.payComponents);
  const salaryStructures = useHrmCompensationStore((s) => s.salaryStructures);
  const componentsLoading = useHrmCompensationStore((s) => s.componentsLoading);
  const selectComponent = useHrmCompensationStore((s) => s.selectComponent);
  const fetchPayComponents = useHrmCompensationStore((s) => s.fetchPayComponents);
  const deletePayComponent = useHrmCompensationStore((s) => s.deletePayComponent);
  const hardDeletePayComponent = useHrmCompensationStore((s) => s.hardDeletePayComponent);

  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const counts = useMemo(() => {
    let earnings = 0;
    let deductions = 0;
    let statutory = 0;
    for (const c of payComponents) {
      if (c.componentType === 'EARNING') earnings += 1;
      else if (c.componentType === 'DEDUCTION') deductions += 1;
      if (isStatutory(c)) statutory += 1;
    }
    return { earnings, deductions, statutory };
  }, [payComponents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return payComponents;
    return payComponents.filter(
      (c) =>
        c.componentCode.toLowerCase().includes(q) ||
        c.componentName.toLowerCase().includes(q) ||
        c.componentType.toLowerCase().includes(q),
    );
  }, [payComponents, search]);

  const openNew = useCallback(() => {
    selectComponent(null);
    setDrawerOpen(true);
  }, [selectComponent]);

  const openEdit = useCallback(
    (component: PayComponent) => {
      selectComponent(component);
      setDrawerOpen(true);
    },
    [selectComponent],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    selectComponent(null);
  }, [selectComponent]);

  const columns: ColumnsType<PayComponent> = useMemo(
    () => [
      {
        title: 'Component',
        key: 'component',
        render: (_, c) => (
          <div className={styles.tableCellStack}>
            <span className={styles.tableCellPrimary}>{c.componentName}</span>
            <span className={styles.tableCellMuted}>{c.componentCode}</span>
          </div>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'componentType',
        key: 'type',
        width: 170,
        render: (t: PayComponent['componentType']) => (
          <Tag color={typeColor(t)} bordered={false}>
            {t.replace('_', ' ')}
          </Tag>
        ),
      },
      {
        title: 'Calculation',
        key: 'calc',
        width: 180,
        render: (_, c) => <span className={styles.tableCellMono}>{describeCalculation(c)}</span>,
      },
      {
        title: 'Used in',
        key: 'usage',
        width: 120,
        render: (_, c) => {
          const n = countStructureUsage(c.componentCode, salaryStructures);
          return (
            <span className={styles.tableCellMuted}>
              {n} {n === 1 ? 'structure' : 'structures'}
            </span>
          );
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 130,
        align: 'right',
        render: (_, c) => (
          <Can I="edit">
            <div className={styles.tableActions}>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlinedIcon style={{ fontSize: 16 }} />}
                  onClick={() => openEdit(c)}
                />
              </Tooltip>
              <Popconfirm
                title="Deactivate this component?"
                description="It is removed from the active list; there is no undo."
                okText="Deactivate"
                cancelText="Cancel"
                onConfirm={() => deletePayComponent(c.componentCode)}
              >
                <Tooltip title="Deactivate">
                  <Button
                    type="text"
                    size="small"
                    icon={<RemoveCircleOutlineIcon style={{ fontSize: 16 }} />}
                  />
                </Tooltip>
              </Popconfirm>
              <Popconfirm
                title="Delete this component?"
                description="This permanently removes the component."
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
                onConfirm={() => hardDeletePayComponent(c.handle)}
              >
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlineIcon style={{ fontSize: 16 }} />}
                  />
                </Tooltip>
              </Popconfirm>
            </div>
          </Can>
        ),
      },
    ],
    [salaryStructures, openEdit, deletePayComponent, hardDeletePayComponent],
  );

  const statCards = [
    { key: 'earn', label: 'Earnings', value: counts.earnings, tone: styles.statAccent, icon: <PaymentsIcon style={{ fontSize: 22 }} /> },
    { key: 'ded', label: 'Deductions', value: counts.deductions, tone: styles.statWarning, icon: <RemoveCircleIcon style={{ fontSize: 22 }} /> },
    { key: 'stat', label: 'Statutory', value: counts.statutory, tone: styles.statInfo, icon: <GavelIcon style={{ fontSize: 22 }} /> },
  ];

  return (
    <div className={styles.tablePage}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Pay Components</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<RefreshIcon style={{ fontSize: 14 }} />}
            onClick={() => fetchPayComponents()}
          />
          <Can I="add">
            <Button type="primary" size="small" icon={<AddIcon style={{ fontSize: 14 }} />} onClick={openNew}>
              New
            </Button>
          </Can>
        </div>
      </div>

      <section className={styles.statGrid} aria-label="Component counts" style={{ marginBottom: 16 }}>
        {statCards.map((s) => (
          <div key={s.key} className={`${styles.statCard} ${s.tone}`}>
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      <Input.Search
        placeholder="Search components..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="small"
        style={{ marginBottom: 12, maxWidth: 320 }}
      />

      {componentsLoading ? (
        <div className={styles.loadingContainer}>
          <Spin />
        </div>
      ) : (
        <Table<PayComponent>
          rowKey="componentCode"
          size="small"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          locale={{ emptyText: 'No components found' }}
        />
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--hrm-text-tertiary)' }}>
        {filtered.length} of {payComponents.length} components
      </div>

      <Drawer
        title={null}
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        styles={{ body: { paddingTop: 16 } }}
      >
        {drawerOpen && <PayComponentForm onSaved={closeDrawer} onCancel={closeDrawer} />}
      </Drawer>
    </div>
  );
};

export default PayComponentsTable;
