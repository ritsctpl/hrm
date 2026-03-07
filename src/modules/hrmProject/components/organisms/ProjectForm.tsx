'use client';
import { useState } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Space, Divider, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import type { ProjectFormValues } from '../../types/ui.types';
import styles from '../../styles/HrmProject.module.css';

let milestoneKey = 0;

export default function ProjectForm() {
  const [form] = Form.useForm<ProjectFormValues>();
  const { editingProject, closeProjectForm, savingProject } = useHrmProjectStore();
  const { createProject, updateProject } = useProjectMutations();
  const [projectType, setProjectType] = useState<'INTERNAL' | 'EXTERNAL'>(
    editingProject?.projectType ?? 'INTERNAL'
  );
  const [milestones, setMilestones] = useState(
    editingProject?.milestones.map((m) => ({ key: m.milestoneId, ...m })) ?? []
  );

  const handleSubmit = async (values: ProjectFormValues) => {
    const formValues: ProjectFormValues = {
      ...values,
      startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : '',
      endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : '',
      milestones: milestones.map((m) => ({
        key: m.key,
        milestoneName: m.milestoneName,
        targetDate: m.targetDate,
        description: m.description ?? '',
      })),
    };
    if (editingProject) {
      await updateProject(editingProject.handle, formValues, 'current-user');
    } else {
      await createProject(formValues, 'current-user');
    }
  };

  const addMilestone = () => {
    milestoneKey += 1;
    setMilestones((prev) => [
      ...prev,
      { key: `new-${milestoneKey}`, milestoneId: '', milestoneName: '', targetDate: '', description: '', status: 'NOT_STARTED' as const },
    ]);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={editingProject ? {
        projectName: editingProject.projectName,
        projectType: editingProject.projectType,
        clientName: editingProject.clientName,
        buCode: editingProject.buCode,
        departmentCode: editingProject.departmentCode,
        projectManagerId: editingProject.projectManagerId,
        estimateHours: editingProject.estimateHours,
        startDate: editingProject.startDate ? dayjs(editingProject.startDate) : null,
        endDate: editingProject.endDate ? dayjs(editingProject.endDate) : null,
        description: editingProject.description,
      } : { projectType: 'INTERNAL' }}
    >
      <Divider orientation="left">Project Identity</Divider>
      <Form.Item name="projectName" label="Project Name" rules={[{ required: true }]}>
        <Input placeholder="e.g. Customer Portal V2" />
      </Form.Item>
      <Form.Item name="projectType" label="Type" rules={[{ required: true }]}>
        <Radio.Group onChange={(e) => setProjectType(e.target.value)}>
          <Radio value="INTERNAL">Internal</Radio>
          <Radio value="EXTERNAL">External</Radio>
        </Radio.Group>
      </Form.Item>
      {projectType === 'EXTERNAL' && (
        <Form.Item name="clientName" label="Client Name">
          <Input placeholder="Client company name" />
        </Form.Item>
      )}
      <Space style={{ display: 'flex' }}>
        <Form.Item name="buCode" label="Business Unit" rules={[{ required: true }]} style={{ flex: 1 }}>
          <Input placeholder="BU Code" />
        </Form.Item>
        <Form.Item name="departmentCode" label="Department" style={{ flex: 1 }}>
          <Input placeholder="Department" />
        </Form.Item>
      </Space>
      <Form.Item name="projectManagerId" label="Project Manager" rules={[{ required: true }]}>
        <Input placeholder="Employee ID" />
      </Form.Item>

      <Divider orientation="left">Planning</Divider>
      <Form.Item name="estimateHours" label="Estimate Hours" rules={[{ required: true, type: 'number', min: 0 }]}>
        <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
      </Form.Item>
      <Space style={{ display: 'flex' }}>
        <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="endDate" label="End Date" rules={[{ required: true }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Space>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={3} />
      </Form.Item>

      <Divider orientation="left">Milestones (optional)</Divider>
      {milestones.map((m, idx) => (
        <Space key={m.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
          <Input
            placeholder="Milestone name"
            value={m.milestoneName}
            onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, milestoneName: e.target.value } : x))}
            style={{ width: 200 }}
          />
          <DatePicker
            value={m.targetDate ? dayjs(m.targetDate) : null}
            onChange={(d) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, targetDate: d?.format('YYYY-MM-DD') ?? '' } : x))}
          />
          <Input
            placeholder="Description"
            value={m.description}
            onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
            style={{ width: 160 }}
          />
          <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== idx))} />
        </Space>
      ))}
      <Button type="dashed" icon={<PlusOutlined />} onClick={addMilestone} block>
        Add Milestone
      </Button>

      <div className={styles.formActions}>
        <Button onClick={closeProjectForm}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={savingProject}>
          {editingProject ? 'Update Project' : 'Save Project'}
        </Button>
      </div>
    </Form>
  );
}
