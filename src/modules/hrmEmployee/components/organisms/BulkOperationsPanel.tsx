'use client';

import React, { useState } from 'react';
import { Drawer, Tabs, Select, Button, message, Alert, Input } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import Can from '../../../hrmAccess/components/Can';
import { useHrmEmployeeStore } from '../../stores/hrmEmployeeStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

const BulkOperationsPanel: React.FC<Props> = ({ open, onClose }) => {
  const { directory } = useHrmEmployeeStore();
  const employees = directory.employees;

  const [selectedHandles, setSelectedHandles] = useState<string[]>([]);
  const [managerHandle, setManagerHandle] = useState('');
  const [department, setDepartment] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [processing, setProcessing] = useState(false);

  const employeeOptions = employees.map((e) => ({
    label: `${e.fullName} (${e.employeeCode})`,
    value: e.handle,
  }));

  const handleBulkAssignManager = async () => {
    if (selectedHandles.length === 0 || !managerHandle.trim()) {
      message.warning('Please select employees and specify a manager');
      return;
    }
    setProcessing(true);
    try {
      const cookies = parseCookies();
      const result = await HrmEmployeeService.bulkAssignManager({
        organizationId: getOrganizationId(),
        handles: selectedHandles,
        managerHandle: managerHandle.trim(),
        modifiedBy: cookies.username || 'system',
      });
      message.success(`Assigned manager: ${(result as Record<string, unknown>).successCount ?? 'N/A'} succeeded, ${(result as Record<string, unknown>).failureCount ?? 0} failed`);
      setSelectedHandles([]);
      setManagerHandle('');
    } catch {
      message.error('Bulk assign manager failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkChangeDept = async () => {
    if (selectedHandles.length === 0 || !department.trim()) {
      message.warning('Please select employees and specify a department');
      return;
    }
    setProcessing(true);
    try {
      const cookies = parseCookies();
      const result = await HrmEmployeeService.bulkChangeDepartment({
        organizationId: getOrganizationId(),
        handles: selectedHandles,
        department: department.trim(),
        modifiedBy: cookies.username || 'system',
      });
      message.success(`Changed department: ${(result as Record<string, unknown>).successCount ?? 'N/A'} succeeded, ${(result as Record<string, unknown>).failureCount ?? 0} failed`);
      setSelectedHandles([]);
      setDepartment('');
    } catch {
      message.error('Bulk change department failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAssignBu = async () => {
    if (selectedHandles.length === 0 || !businessUnit.trim()) {
      message.warning('Please select employees and specify a business unit');
      return;
    }
    setProcessing(true);
    try {
      const cookies = parseCookies();
      const result = await HrmEmployeeService.bulkAssignBu({
        organizationId: getOrganizationId(),
        handles: selectedHandles,
        buHandle: businessUnit.trim(),
        modifiedBy: cookies.username || 'system',
      });
      message.success(`Assigned BU: ${(result as Record<string, unknown>).successCount ?? 'N/A'} succeeded, ${(result as Record<string, unknown>).failureCount ?? 0} failed`);
      setSelectedHandles([]);
      setBusinessUnit('');
    } catch {
      message.error('Bulk assign BU failed');
    } finally {
      setProcessing(false);
    }
  };

  const employeeSelector = (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
        Select Employees
      </label>
      <Select
        mode="multiple"
        value={selectedHandles}
        onChange={setSelectedHandles}
        options={employeeOptions}
        style={{ width: '100%' }}
        placeholder="Search and select employees"
        filterOption={(input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }
        maxTagCount={3}
      />
      {selectedHandles.length > 0 && (
        <span style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
          {selectedHandles.length} employee(s) selected
        </span>
      )}
    </div>
  );

  return (
    <Drawer
      title="Bulk Operations"
      open={open}
      onClose={onClose}
      width={600}
    >
      <Alert
        type="info"
        showIcon
        message="Select employees from the directory and perform bulk operations."
        style={{ marginBottom: 16 }}
      />
      <Tabs
        items={[
          {
            key: 'assignManager',
            label: 'Assign Manager',
            children: (
              <div>
                {employeeSelector}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                    New Manager
                  </label>
                  <Select
                    value={managerHandle || undefined}
                    onChange={setManagerHandle}
                    options={employeeOptions}
                    style={{ width: '100%' }}
                    placeholder="Select new manager"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>
                <Can I="edit" object="employee_official">
                  <Button type="primary" onClick={handleBulkAssignManager} loading={processing}>
                    Assign Manager to Selected
                  </Button>
                </Can>
              </div>
            ),
          },
          {
            key: 'changeDept',
            label: 'Change Department',
            children: (
              <div>
                {employeeSelector}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                    New Department
                  </label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department name"
                  />
                </div>
                <Can I="edit" object="employee_official">
                  <Button type="primary" onClick={handleBulkChangeDept} loading={processing}>
                    Change Department for Selected
                  </Button>
                </Can>
              </div>
            ),
          },
          {
            key: 'assignBU',
            label: 'Assign Business Unit',
            children: (
              <div>
                {employeeSelector}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                    Business Unit
                  </label>
                  <Input
                    value={businessUnit}
                    onChange={(e) => setBusinessUnit(e.target.value)}
                    placeholder="Enter business unit code"
                  />
                </div>
                <Can I="edit" object="employee_official">
                  <Button type="primary" onClick={handleBulkAssignBu} loading={processing}>
                    Assign BU to Selected
                  </Button>
                </Can>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default BulkOperationsPanel;
