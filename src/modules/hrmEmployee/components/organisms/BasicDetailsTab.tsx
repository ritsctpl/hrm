/**
 * BasicDetailsTab - View/edit basic employee details (name, email, phone, status, photo)
 */

'use client';

import React, { useState } from 'react';
import { Button, Input, Form } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import EmpAvatar from '../atoms/EmpAvatar';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import EmpStatusBadge from '../atoms/EmpStatusBadge';
import type { ProfileTabProps } from '../../types/ui.types';
import type { EmployeeStatus } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

const BasicDetailsTab: React.FC<ProfileTabProps> = ({
  profile,
  isEditing,
  isSaving,
  onSave,
}) => {
  const { basicDetails, employeeCode } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave('basic', {
        fullName: values.fullName,
        workEmail: values.workEmail,
        phone: values.phone,
        photoUrl: basicDetails.photoUrl,
        status: basicDetails.status,
      });
      setLocalEditing(false);
    } catch {
      // validation error
    }
  };

  const editing = isEditing || localEditing;

  if (editing) {
    return (
      <div className={styles.tabContent}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            fullName: basicDetails.fullName,
            workEmail: basicDetails.workEmail,
            phone: basicDetails.phone,
          }}
        >
          <div className={formStyles.editFormGrid}>
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: 'Full name is required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="workEmail"
              label="Work Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Phone is required' }]}
            >
              <Input />
            </Form.Item>
          </div>
          <div className={formStyles.editFormActions}>
            <Button icon={<CloseOutlined />} onClick={() => setLocalEditing(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isSaving}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => setLocalEditing(true)}
        >
          Edit
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <EmpAvatar name={basicDetails.fullName} photoUrl={basicDetails.photoUrl} size={72} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
            {basicDetails.fullName}
          </h3>
          <span style={{ fontSize: 13, color: '#64748b' }}>{employeeCode}</span>
          <div style={{ marginTop: 6 }}>
            <EmpStatusBadge status={basicDetails.status as EmployeeStatus} />
          </div>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <EmpFieldLabel label="Full Name" value={basicDetails.fullName} />
        <EmpFieldLabel label="Work Email" value={basicDetails.workEmail} />
        <EmpFieldLabel label="Phone" value={basicDetails.phone} />
        <EmpFieldLabel label="Status" value={basicDetails.status} />
      </div>
    </div>
  );
};

export default BasicDetailsTab;
