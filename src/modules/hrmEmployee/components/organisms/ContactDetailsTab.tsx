/**
 * ContactDetailsTab - View/edit addresses and emergency contacts
 * Uses flat field structure for API payload:
 * presentAddress, permanentAddress, city, state, country, pinZip, emergencyContacts
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Input, Form, Divider, Select, Checkbox } from 'antd';
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
  const [selectedPresentCountry, setSelectedPresentCountry] = useState<string>(
    contactDetails.presentAddress?.country || ''
  );
  const [selectedPermanentCountry, setSelectedPermanentCountry] = useState<string>(
    contactDetails.permanentAddress?.country || ''
  );
  const [sameAsPresent, setSameAsPresent] = useState(false);

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'contact') {
      setLocalEditing(true);
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection]);

  const handlePresentCountryChange = (value: string) => {
    setSelectedPresentCountry(value);
    form.setFieldValue('presentState', undefined);
  };

  const handlePermanentCountryChange = (value: string) => {
    setSelectedPermanentCountry(value);
    form.setFieldValue('permanentState', undefined);
  };

  const handleSameAsPresentChange = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked) {
      // Copy all present address fields to permanent address
      const presentValues = {
        permanentAddress: form.getFieldValue('presentAddress'),
        permanentCity: form.getFieldValue('presentCity'),
        permanentState: form.getFieldValue('presentState'),
        permanentCountry: form.getFieldValue('presentCountry'),
        permanentPinZip: form.getFieldValue('presentPinZip'),
      };
      form.setFieldsValue(presentValues);
      setSelectedPermanentCountry(form.getFieldValue('presentCountry') || '');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Build nested address objects
      const presentAddress = values.presentAddress || values.presentCity || values.presentState || values.presentCountry || values.presentPinZip
        ? {
            address: values.presentAddress || '',
            city: values.presentCity || '',
            state: values.presentState || '',
            country: values.presentCountry || '',
            pinZip: values.presentPinZip || '',
          }
        : undefined;

      const permanentAddress = values.permanentAddress || values.permanentCity || values.permanentState || values.permanentCountry || values.permanentPinZip
        ? {
            address: values.permanentAddress || '',
            city: values.permanentCity || '',
            state: values.permanentState || '',
            country: values.permanentCountry || '',
            pinZip: values.permanentPinZip || '',
          }
        : undefined;

      await onSave('contact', {
        presentAddress,
        permanentAddress,
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
      setSelectedPresentCountry(contactDetails.presentAddress?.country || '');
      setSelectedPermanentCountry(contactDetails.permanentAddress?.country || '');
      setSameAsPresent(false);
      form.resetFields();
    },
  }));

  const editing = localEditing;
  const presentStateOptions = selectedPresentCountry ? (COUNTRY_STATE_MAP[selectedPresentCountry] || []) : [];
  const permanentStateOptions = selectedPermanentCountry ? (COUNTRY_STATE_MAP[selectedPermanentCountry] || []) : [];

  if (editing) {
    return (
      <div className={styles.tabContent}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            presentAddress: contactDetails.presentAddress?.address || '',
            presentCity: contactDetails.presentAddress?.city || '',
            presentState: contactDetails.presentAddress?.state || '',
            presentCountry: contactDetails.presentAddress?.country || '',
            presentPinZip: contactDetails.presentAddress?.pinZip || '',
            permanentAddress: contactDetails.permanentAddress?.address || '',
            permanentCity: contactDetails.permanentAddress?.city || '',
            permanentState: contactDetails.permanentAddress?.state || '',
            permanentCountry: contactDetails.permanentAddress?.country || '',
            permanentPinZip: contactDetails.permanentAddress?.pinZip || '',
            emergencyContacts: contactDetails.emergencyContacts || [],
          }}
        >
          {/* Present Address */}
          <Divider orientation="left" style={{ fontSize: 13, marginTop: 0 }}>
            Present Address
          </Divider>
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="presentAddress"
              label="Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea rows={2} placeholder="Enter street address" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Form.Item name="presentCity" label="City">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item name="presentCountry" label="Country">
              <Select
                placeholder="Select country"
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country,
                  label: country,
                }))}
                onChange={handlePresentCountryChange}
                allowClear
              />
            </Form.Item>
            <Form.Item name="presentState" label="State/Province">
              <Select
                placeholder={selectedPresentCountry ? 'Select state' : 'Select country first'}
                options={presentStateOptions.map((state) => ({
                  value: state,
                  label: state,
                }))}
                disabled={!selectedPresentCountry}
                allowClear
              />
            </Form.Item>
            <Form.Item name="presentPinZip" label="PIN/ZIP Code">
              <Input placeholder="PIN/ZIP Code" />
            </Form.Item>
          </div>

          {/* Permanent Address */}
          <Divider orientation="left" style={{ fontSize: 13 }}>
            Permanent Address
          </Divider>
          
          <div style={{ marginBottom: 12 }}>
            <Checkbox
              checked={sameAsPresent}
              onChange={(e) => handleSameAsPresentChange(e.target.checked)}
            >
              Same as Present Address
            </Checkbox>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="permanentAddress"
              label="Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea 
                rows={2} 
                placeholder="Enter street address"
                disabled={sameAsPresent}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Form.Item name="permanentCity" label="City">
              <Input placeholder="City" disabled={sameAsPresent} />
            </Form.Item>
            <Form.Item name="permanentCountry" label="Country">
              <Select
                placeholder="Select country"
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country,
                  label: country,
                }))}
                onChange={handlePermanentCountryChange}
                disabled={sameAsPresent}
                allowClear
              />
            </Form.Item>
            <Form.Item name="permanentState" label="State/Province">
              <Select
                placeholder={selectedPermanentCountry ? 'Select state' : 'Select country first'}
                options={permanentStateOptions.map((state) => ({
                  value: state,
                  label: state,
                }))}
                disabled={!selectedPermanentCountry || sameAsPresent}
                allowClear
              />
            </Form.Item>
            <Form.Item name="permanentPinZip" label="PIN/ZIP Code">
              <Input placeholder="PIN/ZIP Code" disabled={sameAsPresent} />
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
  
  // Helper to format address object to string
  const formatAddress = (addr?: { address?: string; city?: string; state?: string; country?: string; pinZip?: string }) => {
    if (!addr) return '--';
    const parts = [addr.address, addr.city, addr.state, addr.country, addr.pinZip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '--';
  };

  return (
    <div className={styles.tabContent}>
      <Divider orientation="left" style={{ fontSize: 13, marginTop: 0 }}>
        Present Address
      </Divider>
      <div className={styles.detailGrid}>
        <EmpFieldLabel
          label="Address"
          value={contactDetails.presentAddress?.address || '--'}
        />
        <EmpFieldLabel
          label="City"
          value={contactDetails.presentAddress?.city || '--'}
        />
        <EmpFieldLabel
          label="State/Province"
          value={contactDetails.presentAddress?.state || '--'}
        />
        <EmpFieldLabel
          label="Country"
          value={contactDetails.presentAddress?.country || '--'}
        />
        <EmpFieldLabel
          label="PIN/ZIP Code"
          value={contactDetails.presentAddress?.pinZip || '--'}
        />
      </div>

      <Divider orientation="left" style={{ fontSize: 13, marginTop: 16 }}>
        Permanent Address
      </Divider>
      <div className={styles.detailGrid}>
        <EmpFieldLabel
          label="Address"
          value={contactDetails.permanentAddress?.address || '--'}
        />
        <EmpFieldLabel
          label="City"
          value={contactDetails.permanentAddress?.city || '--'}
        />
        <EmpFieldLabel
          label="State/Province"
          value={contactDetails.permanentAddress?.state || '--'}
        />
        <EmpFieldLabel
          label="Country"
          value={contactDetails.permanentAddress?.country || '--'}
        />
        <EmpFieldLabel
          label="PIN/ZIP Code"
          value={contactDetails.permanentAddress?.pinZip || '--'}
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
