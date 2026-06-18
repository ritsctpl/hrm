'use client';
import { useEffect, useCallback, useState } from 'react';
import { Tabs, Table, Button, DatePicker, Popconfirm, Empty, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { GoPlus } from 'react-icons/go';
import { getOrganizationId } from '@/utils/cookieUtils';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../../services/hrmTimesheetService';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';
import PayrollExportPanel from '../organisms/PayrollExportPanel';
import ComplianceReportPanel from '../organisms/ComplianceReportPanel';
import UnplannedWorkReportPanel from '../organisms/UnplannedWorkReportPanel';
import HolidayWorkingReportPanel from '../organisms/HolidayWorkingReportPanel';
import UnplannedCategoryManager from '../organisms/UnplannedCategoryManager';
import Can from '../../../hrmAccess/components/Can';
import type { ReportTab } from '../../types/ui.types';

// Match the Reports smart-table: sticky header, body scrolls, no pagination.
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 320px)' };

/* ── Lock Period Manager (inline) ────────────────────────────── */
interface LockPeriodRecord {
  handle?: string;
  organizationId: string;
  lockDate: string;
  createdBy: string;
  createdDateTime: string;
}

function LockPeriodManager() {
  const [periods, setPeriods] = useState<LockPeriodRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState<dayjs.Dayjs | null>(null);
  const organizationId = getOrganizationId();
  const user = useEmployeeIdentity().employeeCode || 'system';

  // TODO(backend): no /lockPeriod/list endpoint exists. This loadPeriods is a
  // no-op until the backend exposes one — periods are tracked in local state
  // via save/delete responses.
  const loadPeriods = useCallback(async () => {
    setLoading(false);
  }, []);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const handleAdd = async () => {
    if (!newDate) return;
    try {
      const saved = await HrmTimesheetService.saveLockPeriod({ organizationId,
        lockDate: newDate.format('YYYY-MM-DD'),
        createdBy: user,
      });
      setPeriods((prev) => [
        ...prev,
        {
          handle: saved.handle,
          organizationId: saved.organizationId,
          lockDate: saved.lockDate,
          createdBy: saved.createdBy,
          createdDateTime: saved.createdDateTime,
        },
      ]);
      message.success('Lock period created');
      setNewDate(null);
    } catch {
      message.error('Failed to create lock period');
    }
  };

  const handleDelete = async (record: LockPeriodRecord) => {
    try {
      await HrmTimesheetService.deleteLockPeriod(organizationId, record.handle ?? '', user);
      setPeriods((prev) => prev.filter((p) => p.handle !== record.handle));
      message.success('Lock period deleted');
    } catch {
      message.error('Failed to delete lock period');
    }
  };

  const columns = [
    { title: 'Lock Date', dataIndex: 'lockDate', key: 'lockDate', width: 160, defaultSortOrder: 'descend' as const, sorter: (a: LockPeriodRecord, b: LockPeriodRecord) => (a.lockDate || '').localeCompare(b.lockDate || '') },
    { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy', sorter: (a: LockPeriodRecord, b: LockPeriodRecord) => (a.createdBy || '').localeCompare(b.createdBy || '') },
    {
      title: 'Created At',
      dataIndex: 'createdDateTime',
      key: 'createdDateTime',
      sorter: (a: LockPeriodRecord, b: LockPeriodRecord) => (a.createdDateTime || '').localeCompare(b.createdDateTime || ''),
      render: (v: string) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '\u2014',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: LockPeriodRecord) => (
        <Can I="delete">
          <Popconfirm title="Delete this lock period?" onConfirm={() => handleDelete(record)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Can>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Lock Periods</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <DatePicker value={newDate} onChange={setNewDate} />
          <Can I="add">
            <Button type="primary" icon={<GoPlus />} onClick={handleAdd} disabled={!newDate} style={{ color: '#fff' }}>
              New Lock
            </Button>
          </Can>
        </div>
      </div>
      <Table
        dataSource={periods}
        columns={columns}
        rowKey={(r) => r.handle ?? r.lockDate}
        loading={loading}
        size="small"
        pagination={false}
        scroll={TABLE_SCROLL}
        sticky
        locale={{ emptyText: <Empty description="No lock periods defined" /> }}
      />
    </div>
  );
}

/* ── Reports Template ────────────────────────────────────────── */
export default function TimesheetReportsTemplate() {
  const { activeReportTab, setActiveReportTab } = useHrmTimesheetStore();

  const items = [
    {
      key: 'payroll',
      label: 'Payroll Export',
      children: (
        <div style={{ padding: '12px 0' }}>
          <PayrollExportPanel />
        </div>
      ),
    },
    {
      key: 'compliance',
      label: 'Submission Compliance',
      children: (
        <div style={{ padding: '12px 0' }}>
          <ComplianceReportPanel />
        </div>
      ),
    },
    {
      key: 'unplanned',
      label: 'Unplanned Work',
      children: (
        <div style={{ padding: '12px 0' }}>
          <UnplannedWorkReportPanel />
        </div>
      ),
    },
    {
      key: 'holiday',
      label: 'Holiday Working',
      children: (
        <div style={{ padding: '12px 0' }}>
          <HolidayWorkingReportPanel />
        </div>
      ),
    },
    {
      key: 'categories',
      label: 'Unplanned Categories',
      children: (
        <div style={{ padding: '12px 0' }}>
          <UnplannedCategoryManager />
        </div>
      ),
    },
    {
      key: 'lockPeriods',
      label: 'Lock Periods',
      children: (
        <div style={{ padding: '12px 0' }}>
          <LockPeriodManager />
        </div>
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeReportTab}
      onChange={(k) => setActiveReportTab(k as ReportTab)}
      items={items}
    />
  );
}
