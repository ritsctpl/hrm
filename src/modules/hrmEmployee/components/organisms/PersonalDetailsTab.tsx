/**
 * PersonalDetailsTab - View/edit personal details (DOB, gender, marital status, etc.)
 */

'use client';

import React, { useState } from 'react';
import { Button, Input, Form, Select, DatePicker } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import { formatDate } from '../../utils/transformations';
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  BLOOD_GROUP_OPTIONS,
} from '../../utils/constants';
import type { ProfileTabProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

const PersonalDetailsTab: React.FC<ProfileTabProps> = ({
  profile,
  isEditing,
  isSaving,
  onSave,
}) => {
  const { personalDetails } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave('personal', {
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format('YYYY-MM-DD')
          : personalDetails.dateOfBirth,
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        bloodGroup: values.bloodGroup,
        governmentIds: personalDetails.governmentIds,
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
            dateOfBirth: personalDetails.dateOfBirth
              ? dayjs(personalDetails.dateOfBirth)
              : undefined,
            gender: personalDetails.gender,
            maritalStatus: personalDetails.maritalStatus,
            bloodGroup: personalDetails.bloodGroup,
          }}
        >
          <div className={formStyles.editFormGrid}>
            <Form.Item name="dateOfBirth" label="Date of Birth">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Select
                options={GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label }))}
                placeholder="Select gender"
                allowClear
              />
            </Form.Item>
            <Form.Item name="maritalStatus" label="Marital Status">
              <Select
                options={MARITAL_STATUS_OPTIONS.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
                placeholder="Select status"
                allowClear
              />
            </Form.Item>
            <Form.Item name="bloodGroup" label="Blood Group">
              <Select
                options={BLOOD_GROUP_OPTIONS.map((bg) => ({ value: bg, label: bg }))}
                placeholder="Select blood group"
                allowClear
              />
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

  // Government IDs display
  const govIds = personalDetails.governmentIds || {};
  const govIdEntries = Object.entries(govIds);

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="text" icon={<EditOutlined />} onClick={() => setLocalEditing(true)}>
          Edit
        </Button>
      </div>
      <div className={styles.detailGrid}>
        <EmpFieldLabel label="Date of Birth" value={formatDate(personalDetails.dateOfBirth)} />
        <EmpFieldLabel label="Gender" value={personalDetails.gender} />
        <EmpFieldLabel label="Marital Status" value={personalDetails.maritalStatus} />
        <EmpFieldLabel label="Blood Group" value={personalDetails.bloodGroup} />
        {govIdEntries.map(([key, val]) => (
          <EmpFieldLabel key={key} label={key} value={val} />
        ))}
        {govIdEntries.length === 0 && (
          <EmpFieldLabel label="Government IDs" value="--" />
        )}
      </div>
    </div>
  );
};

export default PersonalDetailsTab;
