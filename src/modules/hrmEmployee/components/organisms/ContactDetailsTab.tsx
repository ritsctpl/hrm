/**
 * ContactDetailsTab - View/edit addresses and emergency contacts
 * Uses flat field structure for API payload:
 * presentAddress, permanentAddress, city, state, country, pinZip, emergencyContacts
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Button, Input, Form, Divider, Select, message } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
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
  const [presentCountry, setPresentCountry] = useState<string>('');
  const [permanentCountry, setPermanentCountry] = useState<string>('');

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'contact') {
      setLocalEditing(true);
      // Initialize country states
      const presentAddr = contactDetails.presentAddress;
      const permAddr = contactDetails.permanentAddress;
      
      if (typeof presentAddr === 'object' && presentAddr) {
        setPresentCountry(presentAddr.country || '');
      } else {
        setPresentCountry(contactDetails.country || '');
      }
      
      if (typeof permAddr === 'object' && permAddr) {
        setPermanentCountry(permAddr.country || '');
      }
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection, contactDetails]);

  const handlePresentCountryChange = (value: string) => {
    setPresentCountry(value);
    form.setFieldValue('presentState', undefined);
  };

  const handlePermanentCountryChange = (value: string) => {
    setPermanentCountry(value);
    form.setFieldValue('permanentState', undefined);
  };

  const handleCopyPermanentToPresent = useCallback(() => {
    const perm = {
      address: form.getFieldValue('permanentAddress') || '',
      city: form.getFieldValue('permanentCity') || '',
      state: form.getFieldValue('permanentState') || '',
      country: form.getFieldValue('permanentCountry') || '',
      pinZip: form.getFieldValue('permanentPinZip') || '',
    };
    const hasAny = Boolean(perm.address || perm.city || perm.state || perm.country || perm.pinZip);
    if (!hasAny) {
      message.info('Fill in the permanent address first, then copy');
      return;
    }
    // Sync the country-dependent state first so the State dropdown renders
    // the correct option list before we set its value.
    setPresentCountry(perm.country);
    form.setFieldsValue({
      presentAddress: perm.address,
      presentCity: perm.city,
      presentCountry: perm.country,
      presentState: perm.state,
      presentPinZip: perm.pinZip,
    });
    message.success('Copied permanent address to present address');
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Build nested address objects for API
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
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to save contact details. Please try again.');
      }
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    cancel: () => {
      setLocalEditing(false);
      setPresentCountry('');
      setPermanentCountry('');
      form.resetFields();
    },
  }));

  const editing = localEditing;
  const presentStateOptions = presentCountry ? (COUNTRY_STATE_MAP[presentCountry] || []) : [];
  const permanentStateOptions = permanentCountry ? (COUNTRY_STATE_MAP[permanentCountry] || []) : [];

  if (editing) {
    // Extract address strings from nested objects for form initialization
    const presentAddr = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.address
      : contactDetails.presentAddress || '';
    
    const permanentAddr = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.address
      : contactDetails.permanentAddress || '';

    const presentCity = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.city
      : contactDetails.city || '';

    const presentState = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.state
      : contactDetails.state || '';

    const presentCountryVal = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.country
      : contactDetails.country || '';

    const presentPinZip = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.pinZip
      : contactDetails.pinZip || '';

    const permanentCity = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.city
      : '';

    const permanentState = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.state
      : '';

    const permanentCountryVal = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.country
      : '';

    const permanentPinZip = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.pinZip
      : '';

    return (
      <div className={styles.tabContent}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            presentAddress: presentAddr,
            presentCity: presentCity,
            presentState: presentState,
            presentCountry: presentCountryVal,
            presentPinZip: presentPinZip,
            permanentAddress: permanentAddr,
            permanentCity: permanentCity,
            permanentState: permanentState,
            permanentCountry: permanentCountryVal,
            permanentPinZip: permanentPinZip,
            emergencyContacts: contactDetails.emergencyContacts || [],
          }}
        >
          {/* Present Address Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 0 }}>
            <Divider orientation="left" style={{ fontSize: 13, margin: '0 8px 0 0', flex: 1 }}>
              Present Address
            </Divider>
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyPermanentToPresent}
              style={{ padding: 0, fontSize: 12 }}
            >
              Same as permanent address
            </Button>
          </div>
          <div style={{ marginBottom: 16, marginTop: 8 }}>
            <Form.Item
              name="presentAddress"
              label="Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea rows={2} placeholder="Enter present address" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Form.Item name="presentCity" label="City">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item
              name="presentCountry"
              label="Country"
              rules={[{ required: false }]}
            >
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
            <Form.Item
              name="presentState"
              label="State/Province"
              rules={[{ required: false }]}
            >
              <Select
                placeholder={presentCountry ? 'Select state' : 'Select country first'}
                options={presentStateOptions.map((state) => ({
                  value: state,
                  label: state,
                }))}
                disabled={!presentCountry}
                allowClear
              />
            </Form.Item>
            <Form.Item name="presentPinZip" label="PIN/ZIP Code">
              <Input placeholder="PIN/ZIP Code" />
            </Form.Item>
          </div>

          {/* Permanent Address Section */}
          <Divider orientation="left" style={{ fontSize: 13 }}>
            Permanent Address
          </Divider>
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="permanentAddress"
              label="Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea rows={2} placeholder="Enter permanent address" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Form.Item name="permanentCity" label="City">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item
              name="permanentCountry"
              label="Country"
              rules={[{ required: false }]}
            >
              <Select
                placeholder="Select country"
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country,
                  label: country,
                }))}
                onChange={handlePermanentCountryChange}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="permanentState"
              label="State/Province"
              rules={[{ required: false }]}
            >
              <Select
                placeholder={permanentCountry ? 'Select state' : 'Select country first'}
                options={permanentStateOptions.map((state) => ({
                  value: state,
                  label: state,
                }))}
                disabled={!permanentCountry}
                allowClear
              />
            </Form.Item>
            <Form.Item name="permanentPinZip" label="PIN/ZIP Code">
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
                        rules={[
                          { required: true, message: 'Phone required' },
                          { pattern: /^[\d\s\-\+\(\)]+$/, message: 'Invalid phone format' },
                        ]}
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

  // Extract display values from nested objects - ensure they're always strings
  const presentAddr: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.address || '--'
    : (contactDetails.presentAddress as string) || '--';

  const permanentAddr: string = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
    ? contactDetails.permanentAddress.address || '--'
    : (contactDetails.permanentAddress as string) || '--';

  const city: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.city || '--'
    : contactDetails.city || '--';

  const state: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.state || '--'
    : contactDetails.state || '--';

  const country: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.country || '--'
    : contactDetails.country || '--';

  const pinZip: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.pinZip || '--'
    : contactDetails.pinZip || '--';

  return (
    <div className={styles.tabContent}>
      <div className={styles.detailGrid}>
        <EmpFieldLabel
          label="Present Address"
          value={presentAddr}
        />
        <EmpFieldLabel
          label="Permanent Address"
          value={permanentAddr}
        />
        <EmpFieldLabel
          label="City"
          value={city}
        />
        <EmpFieldLabel
          label="Country"
          value={country}
        />
        <EmpFieldLabel
          label="State/Province"
          value={state}
        />
        <EmpFieldLabel
          label="PIN/ZIP Code"
          value={pinZip}
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
