/**
 * ContactDetailsTab - View/edit addresses and emergency contacts
 * Uses flat field structure for API payload:
 * presentAddress, permanentAddress, city, state, country, pinZip, emergencyContacts
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Input, Form, Divider, Select } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import type { ProfileTabProps } from '../../types/ui.types';
import type { EmergencyContact } from '../../types/domain.types';
import { COUNTRY_OPTIONS, COUNTRY_STATE_MAP } from '../../utils/constants';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

export interface ContactDetailsTabHandle {
  save: () => Promise<void>;
  cancel: () => void;
}

const ContactDetailsTab = forwardRef<ContactDetailsTabHandle, ProfileTabProps>(({
  profile,
  isEditing,
  isSaving,
  onSave,
  onEdit,
  editingSection,
}, ref) => {
  const { contactDetails } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(contactDetails.country || '');

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'contact') {
      setLocalEditing(true);
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    // Reset state when country changes
    form.setFieldValue('state', undefined);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave('contact', {
        presentAddress: values.presentAddress || undefined,
        permanentAddress: values.permanentAddress || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        country: values.country || undefined,
        pinZip: values.pinZip || undefined,
        emergencyContacts: values.emergencyContacts as EmergencyContact[],
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
      setSelectedCountry(contactDetails.country || '');
      form.resetFields();
    },
  }));

  const editing = localEditing;
  const stateOptions = selectedCountry ? (COUNTRY_STATE_MAP[selectedCountry] || []) : [];

  if (editing) {
    return (
      <div className={styles.tabContent}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            presentAddress: contactDetails.presentAddress || '',
            permanentAddress: contactDetails.permanentAddress || '',
            city: contactDetails.city || '',
            state: contactDetails.state || '',
            country: contactDetails.country || '',
            pinZip: contactDetails.pinZip || '',
            emergencyContacts: contactDetails.emergencyContacts || [],
          }}
        >
          {/* Present Address */}
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="presentAddress"
              label="Present Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea rows={3} placeholder="Enter present address" />
            </Form.Item>
          </div>

          {/* Permanent Address */}
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="permanentAddress"
              label="Permanent Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea rows={3} placeholder="Enter permanent address" />
            </Form.Item>
          </div>

          {/* City, Country, State, PIN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Form.Item name="city" label="City">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: false }]}
            >
              <Select
                placeholder="Select country"
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country,
                  label: country,
                }))}
                onChange={handleCountryChange}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="state"
              label="State/Province"
              rules={[{ required: false }]}
            >
              <Select
                placeholder={selectedCountry ? 'Select state' : 'Select country first'}
                options={stateOptions.map((state) => ({
                  value: state,
                  label: state,
                }))}
                disabled={!selectedCountry}
                allowClear
              />
            </Form.Item>
            <Form.Item name="pinZip" label="PIN/ZIP Code">
              <Input placeholder="PIN/ZIP Code" />
            </Form.Item>
          </div>

          <Divider orientation="left" style={{ fontSize: 13 }}>
            Emergency Contacts
          </Divider>

          <Form.List name="emergencyContacts">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      padding: 12,
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      marginBottom: 12,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, flex: 1 }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="Name"
                        rules={[{ required: true, message: 'Name required' }]}
                      >
                        <Input placeholder="Name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'relationship']}
                        label="Relationship"
                      >
                        <Input placeholder="Relationship" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'phone']}
                        label="Phone"
                        rules={[{ required: true, message: 'Phone required' }]}
                      >
                        <Input placeholder="Phone" />
                      </Form.Item>
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      size="small"
                      style={{ marginTop: 24 }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginBottom: 12 }}
                >
                  Add Emergency Contact
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </div>
    );
  }

  const emergencyContacts = contactDetails.emergencyContacts || [];

  return (
    <div className={styles.tabContent}>
      <div className={styles.detailGrid}>
        <EmpFieldLabel
          label="Present Address"
          value={contactDetails.presentAddress || '--'}
        />
        <EmpFieldLabel
          label="Permanent Address"
          value={contactDetails.permanentAddress || '--'}
        />
        <EmpFieldLabel
          label="City"
          value={contactDetails.city || '--'}
        />
        <EmpFieldLabel
          label="Country"
          value={contactDetails.country || '--'}
        />
        <EmpFieldLabel
          label="State/Province"
          value={contactDetails.state || '--'}
        />
        <EmpFieldLabel
          label="PIN/ZIP Code"
          value={contactDetails.pinZip || '--'}
        />
      </div>

      <Divider orientation="left" style={{ fontSize: 13 }}>
        Emergency Contacts
      </Divider>

      {emergencyContacts.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>No emergency contacts on file.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {emergencyContacts.map((ec, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Name</div>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 4 }}>{ec.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Relationship</div>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 4 }}>{ec.relationship || '--'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Phone</div>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 4 }}>{ec.phone}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ContactDetailsTab.displayName = 'ContactDetailsTab';

export default ContactDetailsTab;
