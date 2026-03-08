'use client';
import React, { useState } from 'react';
import { Button, Modal, Form, Input, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import MilestoneRow from '../molecules/MilestoneRow';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import type { MilestoneStatus } from '../../types/domain.types';
import styles from '../../styles/ProjectDetail.module.css';

export default function ProjectMilestonesTab() {
  const { selectedProject } = useHrmProjectStore();
  const { updateMilestoneStatus, addMilestone, removeMilestone } = useProjectMutations();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  if (!selectedProject) return null;

  const handleStatusChange = (milestoneId: string, status: MilestoneStatus) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? '';
    updateMilestoneStatus(selectedProject.handle, milestoneId, status, userId);
  };

  const handleRemove = (milestoneId: string) => {
    removeMilestone(selectedProject.handle, milestoneId);
  };

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await addMilestone(selectedProject.handle, {
        milestoneName: values.milestoneName,
        targetDate: values.targetDate.format('YYYY-MM-DD'),
        description: values.description,
      });
      setAddModalOpen(false);
      form.resetFields();
    } catch { /* validation error */ }
  };

  return (
    <div className={styles.milestonesTab}>
      <div className={styles.tabHeader}>
        <Button type="primary" ghost icon={<PlusOutlined />} size="small" onClick={() => setAddModalOpen(true)}>
          Add Milestone
        </Button>
      </div>
      <div className={styles.milestonesList}>
        <div className={styles.milestoneHeader}>
          <span>Milestone Name</span>
          <span>Target Date</span>
          <span>Status</span>
          <span>Description</span>
          <span>Actions</span>
        </div>
        {selectedProject.milestones.map((m) => (
          <MilestoneRow
            key={m.milestoneId}
            milestone={m}
            isEditing={false}
            onStatusChange={handleStatusChange}
            onRemove={handleRemove}
          />
        ))}
        {selectedProject.milestones.length === 0 && (
          <div className={styles.emptyList}>No milestones defined</div>
        )}
      </div>

      <Modal
        title="Add Milestone"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAdd}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="milestoneName" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="targetDate" label="Target Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
