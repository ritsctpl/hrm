'use client';
import React, { useState } from 'react';
import { Button, Modal, Form, Input, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import MilestoneRow from '../molecules/MilestoneRow';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import type { Milestone, MilestoneStatus } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectDetail.module.css';

export default function ProjectMilestonesTab() {
  const { selectedProject } = useHrmProjectStore();
  const { updateMilestoneStatus, addMilestone, updateMilestone, removeMilestone } = useProjectMutations();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [form] = Form.useForm();

  if (!selectedProject) return null;

  const handleStatusChange = (milestoneId: string, status: MilestoneStatus) => {
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? '';
    updateMilestoneStatus(selectedProject.handle, milestoneId, status, userId);
  };

  const handleRemove = (milestoneId: string) => {
    removeMilestone(selectedProject.handle, milestoneId);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleEdit = (m: Milestone) => {
    setEditing(m);
    form.setFieldsValue({
      milestoneName: m.milestoneName,
      targetDate: m.targetDate ? dayjs(m.targetDate) : null,
      description: m.description,
    });
    setAddModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        milestoneName: values.milestoneName,
        targetDate: values.targetDate.format('YYYY-MM-DD'),
        description: values.description,
      };
      if (editing) {
        await updateMilestone(selectedProject.handle, editing.milestoneId, payload);
      } else {
        await addMilestone(selectedProject.handle, payload);
      }
      setAddModalOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return; // antd validation
    }
  };

  return (
    <div className={styles.milestonesTab}>
      <div className={styles.tabHeader}>
        <Can I="add">
          <Button type="primary" ghost icon={<PlusOutlined />} size="small" onClick={openCreate}>
            Add Milestone
          </Button>
        </Can>
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
            onEdit={handleEdit}
            onRemove={handleRemove}
          />
        ))}
        {selectedProject.milestones.length === 0 && (
          <div className={styles.emptyList}>No milestones defined</div>
        )}
      </div>

      <Modal
        title={editing ? 'Edit Milestone' : 'Add Milestone'}
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); setEditing(null); }}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
        footer={[
          <Button key="cancel" onClick={() => { setAddModalOpen(false); setEditing(null); }}>Cancel</Button>,
          <Can key="ok" I={editing ? 'edit' : 'add'}>
            <Button type="primary" onClick={handleSave}>{editing ? 'Update' : 'OK'}</Button>
          </Can>,
        ]}
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
