/**
 * PreviousExperienceTab - Past employer entries with add capability
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input, DatePicker, Modal, Empty, Form, message, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import { formatDate } from '../../utils/transformations';
import type { ProfileTabProps } from '../../types/ui.types';
import type { PreviousExperience } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const PreviousExperienceTab: React.FC<ProfileTabProps & { onRefresh: () => void }> = ({
  profile,
  onRefresh,
}) => {
  const { previousExperience } = profile;
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<PreviousExperience | null>(null);
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

      const exp: PreviousExperience = {
        organization: values.employer || values.organization,
        roleDesignation: values.role || values.roleDesignation,
        fromDate: values.fromDate.format('YYYY-MM-DD'),
        toDate: values.toDate.format('YYYY-MM-DD'),
        experienceSummary: values.description || values.experienceSummary,
        // backward compat
        employer: values.employer,
        role: values.role,
        description: values.description,
      };

      await HrmEmployeeService.addExperience(site, profile.handle, exp, modifiedBy);
      message.success('Experience added');
      form.resetFields();
      setAddOpen(false);
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [form, profile.handle, onRefresh]);

  const handleView = (exp: PreviousExperience) => {
    setSelectedExp(exp);
    setViewOpen(true);
  };

  const handleEdit = (exp: PreviousExperience) => {
    setSelectedExp(exp);
    editForm.setFieldsValue({
      employer: exp.employer || exp.organization,
      role: exp.role || exp.roleDesignation,
      fromDate: dayjs(exp.fromDate),
      toDate: dayjs(exp.toDate),
      description: exp.description || exp.experienceSummary,
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

      const exp: PreviousExperience = {
        organization: values.employer || values.organization,
        roleDesignation: values.role || values.roleDesignation,
        fromDate: values.fromDate.format('YYYY-MM-DD'),
        toDate: values.toDate.format('YYYY-MM-DD'),
        experienceSummary: values.description || values.experienceSummary,
        employer: values.employer,
        role: values.role,
        description: values.description,
      };

      // Use update method if we have an expId, otherwise use add
      if (selectedExp?.expId) {
        await HrmEmployeeService.updateExperience(site, profile.handle, exp, selectedExp.expId, modifiedBy);
      } else {
        await HrmEmployeeService.addExperience(site, profile.handle, exp, modifiedBy);
      }
      message.success('Experience updated');
      editForm.resetFields();
      setEditOpen(false);
      setSelectedExp(null);
      onRefresh();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [editForm, profile.handle, onRefresh, selectedExp?.expId]);

  const handleDelete = useCallback(async (exp: PreviousExperience) => {
    try {
      setLoading(true);
      const cookies = parseCookies();
      const site = cookies.site;
      const modifiedBy = cookies.username || 'system';

      if (!exp.expId) {
        message.error('Cannot delete: Experience ID not found');
        return;
      }

      await HrmEmployeeService.removeExperience(site, profile.handle, exp.expId, modifiedBy);
      message.success('Experience deleted');
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
          Add Experience
        </Button>
      </div>

      {previousExperience.length === 0 ? (
        <Empty description="No previous experience recorded" />
      ) : (
        previousExperience.map((exp, idx) => (
          <div key={idx} className={styles.entryCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className={styles.entryTitle}>{exp.role || exp.roleDesignation}</div>
              <div className={styles.entrySub}>
                {exp.employer || exp.organization} &middot; {formatDate(exp.fromDate)} - {formatDate(exp.toDate)}
              </div>
              {(exp.description || exp.experienceSummary) && (
                <div className={styles.entryDesc}>{exp.description || exp.experienceSummary}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleView(exp)}
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(exp)}
              />
              <Popconfirm
                title="Delete Experience"
                description="Are you sure you want to delete this experience?"
                onConfirm={() => handleDelete(exp)}
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
        title="Add Previous Experience"
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
            name="employer"
            label="Employer"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role / Title"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="fromDate"
              label="From Date"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="toDate"
              label="To Date"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="View Experience"
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {selectedExp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Role / Title</label>
              <div style={{ fontSize: 14, marginTop: 4 }}>{selectedExp.role || selectedExp.roleDesignation}</div>
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Employer / Organization</label>
              <div style={{ fontSize: 14, marginTop: 4 }}>{selectedExp.employer || selectedExp.organization}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>From Date</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{formatDate(selectedExp.fromDate)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>To Date</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>{formatDate(selectedExp.toDate)}</div>
              </div>
            </div>
            {(selectedExp.description || selectedExp.experienceSummary) && (
              <div>
                <label style={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Description</label>
                <div style={{ fontSize: 14, marginTop: 4, whiteSpace: 'pre-wrap' }}>{selectedExp.description || selectedExp.experienceSummary}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Experience"
        open={editOpen}
        onOk={handleEditSave}
        onCancel={() => {
          setEditOpen(false);
          editForm.resetFields();
          setSelectedExp(null);
        }}
        confirmLoading={loading}
        okText="Save"
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ padding: '8px 0' }}>
          <Form.Item
            name="employer"
            label="Employer"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role / Title"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="fromDate"
              label="From Date"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="toDate"
              label="To Date"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PreviousExperienceTab;
