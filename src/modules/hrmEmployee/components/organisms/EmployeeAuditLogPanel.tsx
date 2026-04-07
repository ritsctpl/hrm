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

interface EmployeeOption {
  label: string;
  value: string;
  searchText: string;
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
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch employee list when drawer opens
  useEffect(() => {
    if (!open) return;

    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const cookies = parseCookies();
        const site = cookies.site;
        const response = await HrmEmployeeService.fetchDirectory({
          site,
          page: 0,
          size: 1000,
        });
        
        console.log('Employee directory response:', response);
        
        const options: EmployeeOption[] = response.employees.map((emp) => {
          const option = {
            label: `${emp.fullName} (${emp.employeeCode})`,
            value: emp.handle,
            searchText: `${emp.fullName} ${emp.employeeCode} ${emp.workEmail || ''}`.toLowerCase(),
          };
          return option;
        });
        
        console.log('Total options created:', options.length);
        setEmployees(options);
      } catch (error) {
        console.error('Error fetching employees:', error);
        message.error('Failed to load employee list');
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
    { 
      title: 'Field', 
      dataIndex: 'fieldKey',
      width: 140,
      render: (v: string | null) => v ?? '--',
    },
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
          placeholder="Select employee"
          value={handle || undefined}
          onChange={(value) => setHandle(value || '')}
          style={{ width: 300 }}
          allowClear
          showSearch
          loading={loadingEmployees}
          filterOption={(input, option) => {
            if (!option) return false;
            const label = option.label?.toString().toLowerCase() || '';
            return label.includes(input.toLowerCase());
          }}
          options={employees}
        />
        <Button type="primary" onClick={() => loadAuditLog(0)} loading={loading}>
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
        locale={{ emptyText: <Empty description="Enter an employee handle and click Load to view audit history" /> }}
      />
    </Drawer>
  );
};

export default EmployeeAuditLogPanel;
