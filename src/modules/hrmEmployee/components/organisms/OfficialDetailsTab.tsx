/**
 * OfficialDetailsTab - View/edit official employment details
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Input, Form, Select, DatePicker } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import { formatDate } from '../../utils/transformations';
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
      await onSave('official', {
        firstName: values.firstName,
        lastName: values.lastName,
        title: values.title,
        department: values.department,
        role: values.role,
        designation: values.designation,
        reportingManager: values.reportingManager,
        location: values.location,
        businessUnits: values.businessUnits || [],
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
            businessUnits: officialDetails.businessUnits,
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
              <Input />
            </Form.Item>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="designation"
              label="Designation"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="reportingManager" label="Reporting Manager">
              <Input />
            </Form.Item>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="businessUnits" label="Business Units">
              <Select mode="tags" placeholder="Type and press enter" />
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
        <EmpFieldLabel label="Reporting Manager" value={officialDetails.reportingManager} />
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
