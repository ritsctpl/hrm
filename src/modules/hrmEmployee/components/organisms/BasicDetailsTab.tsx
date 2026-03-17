/**
 * BasicDetailsTab - View/edit basic employee details (name, email, phone, status, photo)
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Input, Form, Upload, message } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, CameraOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import EmpAvatar from '../atoms/EmpAvatar';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import EmpStatusBadge from '../atoms/EmpStatusBadge';
import type { ProfileTabProps } from '../../types/ui.types';
import type { EmployeeStatus } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

export interface BasicDetailsTabHandle {
  save: () => Promise<void>;
  cancel: () => void;
}

const BasicDetailsTab = forwardRef<BasicDetailsTabHandle, ProfileTabProps>(({
  profile,
  isEditing,
  isSaving,
  onSave,
  onEdit,
  editingSection,
}, ref) => {
  const { basicDetails, employeeCode } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'basic') {
      setLocalEditing(true);
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection]);

  /**
   * Convert file to base64 string
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Handle photo upload
   */
  const handlePhotoUpload = async (file: File) => {
    try {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Please upload an image file');
        return false;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB');
        return false;
      }

      // Convert to base64
      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
      setFileList([
        {
          uid: '-1',
          name: file.name,
          status: 'done',
          url: base64,
        },
      ]);
      message.success('Image selected successfully');
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error('Failed to process image');
      return false;
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave('basic', {
        fullName: values.fullName,
        workEmail: values.workEmail,
        phone: values.phone,
        photoUrl: basicDetails.photoUrl,
        photoBase64: photoBase64 || undefined,
        status: basicDetails.status,
      });
      setLocalEditing(false);
      setPhotoBase64(null);
      setFileList([]);
    } catch {
      // validation error
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    cancel: () => {
      setLocalEditing(false);
      setPhotoBase64(null);
      setFileList([]);
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
            fullName: basicDetails.fullName,
            workEmail: basicDetails.workEmail,
            phone: basicDetails.phone,
          }}
        >
          {/* Photo Upload Section */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
              Photo
            </label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <EmpAvatar
                  name={basicDetails.fullName}
                  photoUrl={photoBase64 || basicDetails.photoUrl}
                  photoBase64={photoBase64 || basicDetails.photoBase64}
                  size={80}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Upload
                  maxCount={1}
                  fileList={fileList}
                  beforeUpload={handlePhotoUpload}
                  accept="image/*"
                  listType="picture"
                >
                  <Button icon={<CameraOutlined />}>
                    Upload Photo
                  </Button>
                </Upload>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
            </div>
          </div>

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
        </Form>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Photo Section - Passport Size */}
        <div style={{ flexShrink: 0 }}>
          <EmpAvatar name={basicDetails.fullName} photoUrl={basicDetails.photoUrl} photoBase64={basicDetails.photoBase64} shape="passport" />
        </div>

        {/* Details Section */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px 16px' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Employee Name</span>
            <span style={{ fontSize: 13, color: '#1e293b' }}>{basicDetails.fullName}</span>

            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Employee Id</span>
            <span style={{ fontSize: 13, color: '#1e293b' }}>{employeeCode}</span>

            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Email Id</span>
            <span style={{ fontSize: 13, color: '#0066cc', cursor: 'pointer' }}>{basicDetails.workEmail}</span>

            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Contact Number</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#1e293b' }}>{basicDetails.phone}</span>
              <Button type="text" size="small" style={{ padding: 0, height: 'auto' }}>
                Update
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BasicDetailsTab.displayName = 'BasicDetailsTab';

export default BasicDetailsTab;
