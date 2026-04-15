'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Drawer, Table, Button, Select, Empty, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { AuditLogEntry } from '../../types/domain.types';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeHandle?: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

const EmployeeAuditLogPanel: React.FC<Props> = ({ open, onClose, employeeHandle }) => {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [handle, setHandle] = useState(employeeHandle ?? '');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch employee list for the searchable dropdown when the drawer opens.
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!open) return;
      setLoadingEmployees(true);
      try {
        const cookies = parseCookies();
        const site = cookies.site;
        if (!site) return;
        const response = await HrmEmployeeService.fetchDirectory({ site, page: 0, size: 1000 });
        const options = (response.employees || []).map((emp) => ({
          value: emp.handle,
          label: `${emp.employeeCode} - ${emp.fullName}`,
        }));
        setEmployeeOptions(options);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [open]);

  const loadAuditLog = useCallback(async (p = 0) => {
    if (!handle.trim()) {
      message.warning('Please select an employee');
      return;
    }
    setLoading(true);
    try {
      const cookies = parseCookies();
      const site = cookies.site;
      const result = await HrmEmployeeService.getAuditLog(site, handle.trim(), p, 20);
      setData(result.content);
      setTotal(result.totalElements);
      setPage(p);
    } catch {
      message.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [handle]);

  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: 'Timestamp',
      dataIndex: 'performedAt',
      width: 170,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color={ACTION_COLORS[action] ?? 'default'}>{action}</Tag>
      ),
    },
    { title: 'Field', dataIndex: 'field', width: 140 },
    {
      title: 'Old Value',
      dataIndex: 'oldValue',
      ellipsis: true,
      render: (v: unknown) => v ? (
        <span style={{ fontSize: 11 }}>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
      ) : '--',
    },
    {
      title: 'New Value',
      dataIndex: 'newValue',
      ellipsis: true,
      render: (v: unknown) => v ? (
        <span style={{ fontSize: 11 }}>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
      ) : '--',
    },
    { title: 'Performed By', dataIndex: 'performedBy', width: 140 },
  ];

  return (
    <Drawer
      title="Employee Audit Log"
      open={open}
      onClose={onClose}
      width={800}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Select
          showSearch
          placeholder="Select employee"
          value={handle || undefined}
          onChange={(value) => setHandle(value || '')}
          style={{ width: 300 }}
          allowClear
          loading={loadingEmployees}
          options={employeeOptions}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        <Button type="primary" onClick={() => loadAuditLog(0)} loading={loading} disabled={!handle}>
          Load
        </Button>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="handle"
        loading={loading}
        size="small"
        scroll={{ x: 800 }}
        pagination={{
          current: page + 1,
          pageSize: 20,
          total,
          onChange: (p) => loadAuditLog(p - 1),
          showTotal: (t) => `${t} entries`,
        }}
        locale={{ emptyText: <Empty description="Select an employee and click Load to view audit history" /> }}
      />
    </Drawer>
  );
};

export default EmployeeAuditLogPanel;
