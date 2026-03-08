'use client';

import React, { useState } from 'react';
import { Drawer, Button, Select, message, Space, Card } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';

interface Props {
  open: boolean;
  onClose: () => void;
}

const EmployeeExportPanel: React.FC<Props> = ({ open, onClose }) => {
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const cookies = parseCookies();
      const site = cookies.site;
      const blob = await HrmEmployeeService.exportEmployees(site, {
        department: departmentFilter,
        status: statusFilter,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Export complete');
    } catch {
      message.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Drawer
      title="Export Employees"
      open={open}
      onClose={onClose}
      width={400}
    >
      <Card size="small" title="Filters (optional)">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500 }}>
              Department
            </label>
            <Select
              value={departmentFilter}
              onChange={setDepartmentFilter}
              style={{ width: '100%' }}
              placeholder="All departments"
              allowClear
              options={[
                { label: 'Engineering', value: 'Engineering' },
                { label: 'Finance', value: 'Finance' },
                { label: 'Human Resources', value: 'Human Resources' },
                { label: 'Operations', value: 'Operations' },
                { label: 'Sales', value: 'Sales' },
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500 }}>
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="All statuses"
              allowClear
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
              ]}
            />
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            block
          >
            Export CSV
          </Button>
        </Space>
      </Card>
    </Drawer>
  );
};

export default EmployeeExportPanel;
