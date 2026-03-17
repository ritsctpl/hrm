/**
 * PersonalDetailsTab - View/edit personal details (DOB, gender, marital status, nationality, govt IDs)
 * Supports multiple government IDs with validation (PAN, Aadhar, Passport, etc.)
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Input, Form, Select, DatePicker, Checkbox, Divider } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import { formatDate } from '../../utils/transformations';
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  COUNTRY_OPTIONS,
  GOVT_ID_TYPES,
  PAN_REGEX,
  AADHAR_REGEX,
  PASSPORT_REGEX,
  DRIVING_LICENSE_REGEX,
} from '../../utils/constants';
import type { ProfileTabProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

export interface PersonalDetailsTabHandle {
  save: () => Promise<void>;
  cancel: () => void;
}

/** Validate government ID based on type */
const validateGovtId = (idType: string, idNumber: string): boolean => {
  if (!idNumber) return false;
  
  switch (idType) {
    case 'PAN':
      return PAN_REGEX.test(idNumber);
    case 'AADHAR':
      return AADHAR_REGEX.test(idNumber);
    case 'PASSPORT':
      return PASSPORT_REGEX.test(idNumber);
    case 'DRIVING_LICENSE':
      return DRIVING_LICENSE_REGEX.test(idNumber);
    default:
      return idNumber.length > 0;
  }
};

/** Get validation error message for government ID */
const getGovtIdErrorMessage = (idType: string): string => {
  switch (idType) {
    case 'PAN':
      return 'PAN must be in format: AAAAA9999A (e.g., ABCDE1234F)';
    case 'AADHAR':
      return 'Aadhar must be 12 digits';
    case 'PASSPORT':
      return 'Passport must be 6-9 alphanumeric characters';
    case 'DRIVING_LICENSE':
      return 'Driving License must be 8-16 alphanumeric characters';
    default:
      return 'Invalid ID number';
  }
};

const PersonalDetailsTab = forwardRef<PersonalDetailsTabHandle, ProfileTabProps>(({
  profile,
  isEditing,
  isSaving,
  onSave,
  onEdit,
  editingSection,
}, ref) => {
  const { personalDetails } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'personal') {
      setLocalEditing(true);
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection]);

  // Convert govtIds object to array format for form
  const govtIdsArray = personalDetails.govtIds
    ? Object.entries(personalDetails.govtIds).map(([idType, idNumber]) => ({
        idType,
        idNumber,
        verified: false, // Default to false, can be updated from API
      }))
    : [];

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Convert govtIds array back to object format for API
      const govtIdsObj: Record<string, string> = {};
      if (values.govtIds && Array.isArray(values.govtIds)) {
        values.govtIds.forEach((item: any) => {
          if (item.idType && item.idNumber) {
            govtIdsObj[item.idType] = item.idNumber;
          }
        });
      }

      await onSave('personal', {
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format('YYYY-MM-DD')
          : personalDetails.dateOfBirth,
        gender: values.gender || undefined,
        maritalStatus: values.maritalStatus || undefined,
        bloodGroup: values.bloodGroup || undefined,
        nationality: values.nationality || undefined,
        govtIds: Object.keys(govtIdsObj).length > 0 ? govtIdsObj : undefined,
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
            dateOfBirth: personalDetails.dateOfBirth
              ? dayjs(personalDetails.dateOfBirth)
              : undefined,
            gender: personalDetails.gender,
            maritalStatus: personalDetails.maritalStatus,
            bloodGroup: personalDetails.bloodGroup,
            nationality: personalDetails.nationality,
            govtIds: govtIdsArray,
          }}
        >
          <div className={formStyles.editFormGrid}>
            <Form.Item
              name="dateOfBirth"
              label="Date of Birth"
              rules={[{ required: false }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: false }]}
            >
              <Select
                options={GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label }))}
                placeholder="Select gender"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="maritalStatus"
              label="Marital Status"
              rules={[{ required: false }]}
            >
              <Select
                options={MARITAL_STATUS_OPTIONS.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
                placeholder="Select status"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="bloodGroup"
              label="Blood Group"
              rules={[{ required: false }]}
            >
              <Select
                options={BLOOD_GROUP_OPTIONS.map((bg) => ({ value: bg, label: bg }))}
                placeholder="Select blood group"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="nationality"
              label="Nationality"
              rules={[{ required: false }]}
            >
              <Select
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country,
                  label: country,
                }))}
                placeholder="Select nationality"
                allowClear
              />
            </Form.Item>
          </div>

          <Divider orientation="left" style={{ fontSize: 13, marginTop: 24 }}>
            Government IDs
          </Divider>

          <Form.List name="govtIds">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ marginBottom: 16, padding: 12, border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-start' }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'idType']}
                        label="ID Type"
                        rules={[{ required: true, message: 'ID type required' }]}
                      >
                        <Select
                          options={GOVT_ID_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                          placeholder="Select ID type"
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'idNumber']}
                        label="ID Number"
                        rules={[
                          { required: true, message: 'ID number required' },
                          {
                            validator: (_, value) => {
                              const idType = form.getFieldValue(['govtIds', name, 'idType']);
                              if (!idType || !value) return Promise.resolve();
                              if (validateGovtId(idType, value)) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error(getGovtIdErrorMessage(idType)));
                            },
                          },
                        ]}
                      >
                        <Input placeholder="Enter ID number" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'verified']}
                        valuePropName="checked"
                        label="Verified"
                      >
                        <Checkbox />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        style={{ marginTop: 24 }}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginBottom: 12 }}
                >
                  Add Government ID
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </div>
    );
  }

  // Government IDs display
  const govIds = personalDetails.govtIds || {};
  const govIdEntries = Object.entries(govIds);

  return (
    <div className={styles.tabContent}>
      <div className={styles.detailGrid}>
        <EmpFieldLabel label="Date of Birth" value={formatDate(personalDetails.dateOfBirth)} />
        <EmpFieldLabel label="Gender" value={personalDetails.gender || '--'} />
        <EmpFieldLabel label="Marital Status" value={personalDetails.maritalStatus || '--'} />
        <EmpFieldLabel label="Blood Group" value={personalDetails.bloodGroup || '--'} />
        <EmpFieldLabel label="Nationality" value={personalDetails.nationality || '--'} />
      </div>

      <Divider orientation="left" style={{ fontSize: 13, marginTop: 24 }}>
        Government IDs
      </Divider>

      {govIdEntries.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>No government IDs on file.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {govIdEntries.map(([idType, idNumber]) => (
            <div
              key={idType}
              style={{
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                  {GOVT_ID_TYPES.find((t) => t.value === idType)?.label || idType}
                </div>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 4 }}>
                  {idNumber}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

PersonalDetailsTab.displayName = 'PersonalDetailsTab';

export default PersonalDetailsTab;
