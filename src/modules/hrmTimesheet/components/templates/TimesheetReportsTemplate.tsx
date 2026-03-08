'use client';
import { useEffect, useCallback, useState } from 'react';
import { Tabs, Table, Button, DatePicker, Popconfirm, Empty, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../../services/hrmTimesheetService';
import PayrollExportPanel from '../organisms/PayrollExportPanel';
import ComplianceReportPanel from '../organisms/ComplianceReportPanel';
import UnplannedWorkReportPanel from '../organisms/UnplannedWorkReportPanel';
import HolidayWorkingReportPanel from '../organisms/HolidayWorkingReportPanel';
import UnplannedCategoryManager from '../organisms/UnplannedCategoryManager';
import type { ReportTab } from '../../types/ui.types';

/* ── Lock Period Manager (inline) ────────────────────────────── */
interface LockPeriodRecord {
  handle?: string;
  site: string;
  lockDate: string;
  createdBy: string;
  createdDateTime: string;
}

function LockPeriodManager() {
  const [periods, setPeriods] = useState<LockPeriodRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState<dayjs.Dayjs | null>(null);
  const site = parseCookies().site ?? '';
  const user = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await HrmTimesheetService.getLockPeriods(site);
      setPeriods(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const handleAdd = async () => {
    if (!newDate) return;
    try {
      await HrmTimesheetService.saveLockPeriod({
        site,
        lockDate: newDate.format('YYYY-MM-DD'),
        createdBy: user,
      });
      message.success('Lock period created');
      setNewDate(null);
      loadPeriods();
    } catch {
      message.error('Failed to create lock period');
    }
  };

  const handleDelete = async (record: LockPeriodRecord) => {
    try {
      await HrmTimesheetService.deleteLockPeriod(site, record.handle ?? '', user);
      message.success('Lock period deleted');
      loadPeriods();
    } catch {
      message.error('Failed to delete lock period');
    }
  };

  const columns = [
    { title: 'Lock Date', dataIndex: 'lockDate', key: 'lockDate', width: 160 },
    { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy' },
    {
      title: 'Created At',
      dataIndex: 'createdDateTime',
      key: 'createdDateTime',
      render: (v: string) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '\u2014',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: LockPeriodRecord) => (
        <Popconfirm title="Delete this lock period?" onConfirm={() => handleDelete(record)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Lock Periods</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <DatePicker value={newDate} onChange={setNewDate} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!newDate}>
            New Lock
          </Button>
        </div>
      </div>
      <Table
        dataSource={periods}
        columns={columns}
        rowKey={(r) => r.handle ?? r.lockDate}
        loading={loading}
        size="small"
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
