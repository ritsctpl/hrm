/**
 * OfficialDetailsTab - View/edit official employment details
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Button, Input, Form, Select, DatePicker, message } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import { formatDate } from '../../utils/transformations';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { ProfileTabProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

export interface OfficialDetailsTabHandle {
  save: () => Promise<void>;
  cancel: () => void;
}

const OfficialDetailsTab = forwardRef<OfficialDetailsTabHandle, ProfileTabProps>(({
  profile,
  isEditing,
  isSaving,
  onSave,
  onEdit,
  editingSection,
}, ref) => {
  const { officialDetails } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);
  
  // Dropdown options state
  const [departments, setDepartments] = useState<Array<{ label: string; value: string }>>([]);
  const [locations, setLocations] = useState<Array<{ label: string; value: string }>>([]);
  const [businessUnits, setBusinessUnits] = useState<Array<{ label: string; value: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Fetch dropdown options when entering edit mode
  useEffect(() => {
    if (localEditing) {
      fetchDropdownOptions();
    }
  }, [localEditing]);

  const fetchDropdownOptions = async () => {
    setLoadingOptions(true);
    try {
      const site = parseCookies().site;
      if (!site) {
        message.error('Site not found');
        return;
      }

      // Fetch locations
      try {
        const locationsData = await HrmOrganizationService.fetchAllLocations(site);
        setLocations(
          locationsData.map((loc) => ({
            label: loc.name || loc.code || loc.id,
            value: loc.id,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }

      // Fetch employees for reporting manager dropdown
      try {
        const employeesData = await HrmEmployeeService.fetchDirectory({ site, page: 0, size: 1000 });
        setEmployees(
          (employeesData.employees || []).map((emp) => ({
            label: `${emp.fullName} (${emp.employeeCode})`,
            value: emp.handle,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }

      // Note: Departments and Business Units require companyHandle/buHandle
      // For now, we'll allow free text input for these fields
      // You can enhance this by fetching company data first
      
    } catch (error) {
      console.error('Failed to fetch dropdown options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'official') {
      setLocalEditing(true);
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // businessUnits is already an array from tags mode, ensure it's always an array
      const businessUnits = Array.isArray(values.businessUnits) 
        ? values.businessUnits 
        : values.businessUnits 
          ? [values.businessUnits] 
          : [];
      
      await onSave('official', {
        firstName: values.firstName,
        lastName: values.lastName,
        title: values.title,
        department: values.department,
        role: values.role,
        designation: values.designation,
        reportingManager: values.reportingManager,
        reportingManagerName: officialDetails.reportingManagerName, // Preserve existing name
        location: values.location,
        businessUnits: businessUnits,
        joiningDate: values.joiningDate
          ? values.joiningDate.format('YYYY-MM-DD')
          : officialDetails.joiningDate,
      });
      setLocalEditing(false);
    } catch {
      // validation error
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    cancel: () => {
      setLocalEditing(false);
      form.resetFields();
    },
  }));

  const editing = localEditing;

  if (editing) {
    return (
      <div className={styles.tabContent}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            firstName: officialDetails.firstName,
            lastName: officialDetails.lastName,
            title: officialDetails.title,
            department: officialDetails.department,
            role: officialDetails.role,
            designation: officialDetails.designation,
            reportingManager: officialDetails.reportingManager,
            location: officialDetails.location,
            businessUnits: officialDetails.businessUnits || [], // Keep as array for tags mode
            joiningDate: officialDetails.joiningDate
              ? dayjs(officialDetails.joiningDate)
              : undefined,
          }}
        >
          <div className={formStyles.editFormGrid}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="title" label="Title">
              <Select
                showSearch
                allowClear
                placeholder="Select or type title"
                options={[
                  { label: 'Mr', value: 'Mr' },
                  { label: 'Ms', value: 'Ms' },
                  { label: 'Mrs', value: 'Mrs' },
                  { label: 'Dr', value: 'Dr' },
                ]}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select department"
                loading={loadingOptions}
                options={departments}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select role"
                options={[
                  { label: 'EMPLOYEE', value: 'EMPLOYEE' },
                  { label: 'MANAGER', value: 'MANAGER' },
                  { label: 'ADMIN', value: 'ADMIN' },
                  { label: 'HR', value: 'HR' },
                  { label: 'DIRECTOR', value: 'DIRECTOR' },
                ]}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="designation"
              label="Designation"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select designation"
                options={[
                  { label: 'Software Engineer', value: 'Software Engineer' },
                  { label: 'Senior Software Engineer', value: 'Senior Software Engineer' },
                  { label: 'Team Lead', value: 'Team Lead' },
                  { label: 'Manager', value: 'Manager' },
                  { label: 'Senior Manager', value: 'Senior Manager' },
                  { label: 'Director', value: 'Director' },
                  { label: 'HR Executive', value: 'HR Executive' },
                  { label: 'HR Manager', value: 'HR Manager' },
                ]}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="reportingManager" label="Reporting Manager">
              <Select
                showSearch
                allowClear
                placeholder="Select reporting manager"
                loading={loadingOptions}
                options={employees}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select location"
                loading={loadingOptions}
                options={locations}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="businessUnits" label="Business Units">
              <Select
                showSearch
                allowClear
                placeholder="Select or type business unit"
                loading={loadingOptions}
                options={businessUnits}
                mode="tags"
                maxCount={1}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="joiningDate" label="Joining Date">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.detailGrid}>
        <EmpFieldLabel label="First Name" value={officialDetails.firstName} />
        <EmpFieldLabel label="Last Name" value={officialDetails.lastName} />
        <EmpFieldLabel label="Title" value={officialDetails.title} />
        <EmpFieldLabel label="Department" value={officialDetails.department} />
        <EmpFieldLabel label="Role" value={officialDetails.role} />
        <EmpFieldLabel label="Designation" value={officialDetails.designation} />
        <EmpFieldLabel 
          label="Reporting Manager" 
          value={officialDetails.reportingManagerName || officialDetails.reportingManager || '--'} 
        />
        <EmpFieldLabel label="Location" value={officialDetails.location} />
        <EmpFieldLabel
          label="Business Units"
          value={officialDetails.businessUnits?.join(', ') || '--'}
        />
        <EmpFieldLabel label="Joining Date" value={formatDate(officialDetails.joiningDate)} />
      </div>
    </div>
  );
});

OfficialDetailsTab.displayName = 'OfficialDetailsTab';

export default OfficialDetailsTab;
