/**
 * PreviousExperienceTab - Past employer entries with add capability
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input, DatePicker, Modal, Empty, Form, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const cookies = parseCookies();
      const site = cookies.site;
      const modifiedBy = cookies.username || 'system';

      const exp: PreviousExperience = {
        employer: values.employer,
        role: values.role,
        fromDate: values.fromDate.format('YYYY-MM-DD'),
        toDate: values.toDate.format('YYYY-MM-DD'),
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

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setAddOpen(true)}
        >
          Add Experience
        </Button>
      </div>

      {previousExperience.length === 0 ? (
        <Empty description="No previous experience recorded" />
      ) : (
        previousExperience.map((exp, idx) => (
          <div key={idx} className={styles.entryCard}>
            <div className={styles.entryTitle}>{exp.role}</div>
            <div className={styles.entrySub}>
              {exp.employer} &middot; {formatDate(exp.fromDate)} - {formatDate(exp.toDate)}
            </div>
            {exp.description && (
              <div className={styles.entryDesc}>{exp.description}</div>
            )}
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
        destroyOnClose
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
    </div>
  );
};

export default PreviousExperienceTab;
