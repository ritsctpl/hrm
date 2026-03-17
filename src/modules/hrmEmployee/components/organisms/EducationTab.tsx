/**
 * EducationTab - Education entries with add capability
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input, InputNumber, Modal, Empty, Form, message, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { ProfileTabProps } from '../../types/ui.types';
import type { EducationEntry } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const EducationTab: React.FC<ProfileTabProps & { onRefresh: () => void }> = ({
  profile,
  onRefresh,
}) => {
  const { education } = profile;
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState<EducationEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const handleAdd = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const cookies = parseCookies();
      const site = cookies.site;
      const modifiedBy = cookies.username || 'system';

      const edu: EducationEntry = {
        institution: values.institution,
        qualification: values.degree || values.qualification || '',
        yearOfPassing: values.year || values.yearOfPassing,
        fieldOfStudy: values.field || values.fieldOfStudy,
        gradePercentage: values.grade || values.gradePercentage,
        // backward compat
        degree: values.degree,
        field: values.field,
        year: values.year,
        grade: values.grade,
      };

      await HrmEmployeeService.addEducation(site, profile.handle, edu, modifiedBy);
      message.success('Education entry added');
      form.resetFields();
      setAddOpen(false);
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [form, profile.handle, onRefresh]);

  const handleView = (edu: EducationEntry) => {
    setSelectedEdu(edu);
    setViewOpen(true);
  };

  const handleEdit = (edu: EducationEntry) => {
    setSelectedEdu(edu);
    editForm.setFieldsValue({
      institution: edu.institution,
      degree: edu.degree || edu.qualification,
      field: edu.field || edu.fieldOfStudy,
      year: edu.year || edu.yearOfPassing,
      grade: edu.grade || edu.gradePercentage,
    });
    setEditOpen(true);
  };

  const handleEditSave = useCallback(async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);

      const cookies = parseCookies();
      const site = cookies.site;
      const modifiedBy = cookies.username || 'system';

      const edu: EducationEntry = {
        institution: values.institution,
        qualification: values.degree || values.qualification || '',
        yearOfPassing: values.year || values.yearOfPassing,
        fieldOfStudy: values.field || values.fieldOfStudy,
        gradePercentage: values.grade || values.gradePercentage,
        degree: values.degree,
        field: values.field,
        year: values.year,
        grade: values.grade,
      };

      // Use update method if we have an eduId, otherwise use add
      if (selectedEdu?.eduId) {
        await HrmEmployeeService.updateEducation(site, profile.handle, edu, selectedEdu.eduId, modifiedBy);
      } else {
        await HrmEmployeeService.addEducation(site, profile.handle, edu, modifiedBy);
      }
      message.success('Education entry updated');
      editForm.resetFields();
      setEditOpen(false);
      setSelectedEdu(null);
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [editForm, profile.handle, onRefresh, selectedEdu?.eduId]);

  const handleDelete = useCallback(async (edu: EducationEntry) => {
    try {
      setLoading(true);
      const cookies = parseCookies();
      const site = cookies.site;
      const modifiedBy = cookies.username || 'system';

      if (!edu.eduId) {
        message.error('Cannot delete: Education ID not found');
        return;
      }

      await HrmEmployeeService.removeEducation(site, profile.handle, edu.eduId, modifiedBy);
      message.success('Education entry deleted');
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile.handle, onRefresh]);

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          type="primary"
          size="small"
          onClick={() => setAddOpen(true)}
        >
          Add Education
        </Button>
      </div>

      {education.length === 0 ? (
        <Empty description="No education entries recorded" />
      ) : (
        education.map((edu, idx) => (
          <div key={idx} className={styles.entryCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className={styles.entryTitle}>
                {edu.degree || edu.qualification} in {edu.field || edu.fieldOfStudy}
              </div>
              <div className={styles.entrySub}>
                {edu.institution} &middot; {edu.year || edu.yearOfPassing}
                {(edu.grade || edu.gradePercentage) && ` &middot; Grade: ${edu.grade || edu.gradePercentage}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleView(edu)}
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(edu)}
              />
              <Popconfirm
                title="Delete Education"
                description="Are you sure you want to delete this education entry?"
                onConfirm={() => handleDelete(edu)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={loading}
                />
              </Popconfirm>
            </div>
          </div>
        ))
      )}

      <Modal
        title="Add Education"
        open={addOpen}
        onOk={handleAdd}
        onCancel={() => {
          setAddOpen(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        okText="Add"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ padding: '8px 0' }}>
          <Form.Item
            name="institution"
            label="Institution"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="degree"
              label="Degree"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="field"
              label="Field of Study"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="year"
              label="Year"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={1950} max={2100} />
            </Form.Item>
            <Form.Item name="grade" label="Grade / GPA" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="View Education"
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {selectedEdu && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Institution</label>
              <div style={{ fontSize: 14, marginTop: 4 }}>{selectedEdu.institution}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Degree</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{selectedEdu.degree || selectedEdu.qualification}</div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Field of Study</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{selectedEdu.field || selectedEdu.fieldOfStudy}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Year</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{selectedEdu.year || selectedEdu.yearOfPassing}</div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Grade / GPA</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{selectedEdu.grade || selectedEdu.gradePercentage || '--'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Education"
        open={editOpen}
        onOk={handleEditSave}
        onCancel={() => {
          setEditOpen(false);
          editForm.resetFields();
          setSelectedEdu(null);
        }}
        confirmLoading={loading}
        okText="Save"
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ padding: '8px 0' }}>
          <Form.Item
            name="institution"
            label="Institution"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="degree"
              label="Degree"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="field"
              label="Field of Study"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="year"
              label="Year"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={1950} max={2100} />
            </Form.Item>
            <Form.Item name="grade" label="Grade / GPA" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EducationTab;
