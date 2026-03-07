/**
 * ContactDetailsTab - View/edit addresses and emergency contacts
 */

'use client';

import React, { useState } from 'react';
import { Button, Input, Form, Divider } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import { formatAddress } from '../../utils/transformations';
import type { ProfileTabProps } from '../../types/ui.types';
import type { Address, EmergencyContact } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

const AddressFields: React.FC<{ prefix: string; label: string }> = ({ prefix, label }) => (
  <div className={formStyles.addressBlock}>
    <div className={formStyles.addressBlockTitle}>{label}</div>
    <div className={formStyles.formRow}>
      <Form.Item name={[prefix, 'line1']} label="Line 1">
        <Input />
      </Form.Item>
      <Form.Item name={[prefix, 'line2']} label="Line 2">
        <Input />
      </Form.Item>
    </div>
    <div className={formStyles.formRow}>
      <Form.Item name={[prefix, 'city']} label="City">
        <Input />
      </Form.Item>
      <Form.Item name={[prefix, 'state']} label="State">
        <Input />
      </Form.Item>
    </div>
    <div className={formStyles.formRow}>
      <Form.Item name={[prefix, 'pinCode']} label="PIN Code">
        <Input />
      </Form.Item>
      <Form.Item name={[prefix, 'country']} label="Country">
        <Input />
      </Form.Item>
    </div>
  </div>
);

const ContactDetailsTab: React.FC<ProfileTabProps> = ({
  profile,
  isEditing,
  isSaving,
  onSave,
}) => {
  const { contactDetails } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave('contact', {
        presentAddress: values.presentAddress as Address,
        permanentAddress: values.permanentAddress as Address,
        emergencyContacts: values.emergencyContacts as EmergencyContact[],
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
            presentAddress: contactDetails.presentAddress || {},
            permanentAddress: contactDetails.permanentAddress || {},
            emergencyContacts: contactDetails.emergencyContacts || [],
          }}
        >
          <AddressFields prefix="presentAddress" label="Present Address" />
          <AddressFields prefix="permanentAddress" label="Permanent Address" />

          <Divider orientation="left" style={{ fontSize: 13 }}>
            Emergency Contacts
          </Divider>

          <Form.List name="emergencyContacts">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className={formStyles.contactItem}>
                    <div className={formStyles.contactItemInfo} style={{ display: 'flex', gap: 8 }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Name required' }]}
                        style={{ flex: 1 }}
                      >
                        <Input placeholder="Name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'relationship']}
                        style={{ flex: 1 }}
                      >
                        <Input placeholder="Relationship" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'phone']}
                        rules={[{ required: true, message: 'Phone required' }]}
                        style={{ flex: 1 }}
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

  const emergencyContacts = contactDetails.emergencyContacts || [];

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="text" icon={<EditOutlined />} onClick={() => setLocalEditing(true)}>
          Edit
        </Button>
      </div>

      <div className={styles.detailGrid}>
        <EmpFieldLabel
          label="Present Address"
          value={formatAddress(contactDetails.presentAddress)}
        />
        <EmpFieldLabel
          label="Permanent Address"
          value={formatAddress(contactDetails.permanentAddress)}
        />
      </div>

      <Divider orientation="left" style={{ fontSize: 13 }}>
        Emergency Contacts
      </Divider>

      {emergencyContacts.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>No emergency contacts on file.</div>
      ) : (
        emergencyContacts.map((ec, idx) => (
          <div key={idx} className={formStyles.contactItem}>
            <div className={formStyles.contactItemInfo}>
              <span className={formStyles.contactItemName}>{ec.name}</span>
              <span className={formStyles.contactItemMeta}>
                {ec.relationship} &middot; {ec.phone}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ContactDetailsTab;
