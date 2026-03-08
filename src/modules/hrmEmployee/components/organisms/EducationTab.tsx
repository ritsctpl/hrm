/**
 * EducationTab - Education entries with add capability
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input, InputNumber, Modal, Empty, Form, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

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

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setAddOpen(true)}
        >
          Add Education
        </Button>
      </div>

      {education.length === 0 ? (
        <Empty description="No education entries recorded" />
      ) : (
        education.map((edu, idx) => (
          <div key={idx} className={styles.entryCard}>
            <div className={styles.entryTitle}>
              {edu.degree} in {edu.field}
            </div>
            <div className={styles.entrySub}>
              {edu.institution} &middot; {edu.year}
              {edu.grade && ` &middot; Grade: ${edu.grade}`}
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
        destroyOnClose
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
    </div>
  );
};

export default EducationTab;
