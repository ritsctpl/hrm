'use client';
import { useEffect } from 'react';
import { Modal, Form, InputNumber, DatePicker, Input, Alert, Typography, Switch } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import type { Project, ProjectTask } from '../../types/domain.types';

const { Text } = Typography;

interface Props {
  open: boolean;
  task: ProjectTask | null;
  project: Project | null;
  onClose: () => void;
}

export default function ExtendTaskModal({ open, task, project, onClose }: Props) {
  const [form] = Form.useForm<{ additionalHours: number; extendEndDate: boolean; newProjectEndDate?: dayjs.Dayjs; reason?: string }>();
  const { extendTask } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ extendEndDate: false });
    }
  }, [open]);

  const est = task?.estimatedHours ?? 0;
  const actual = task?.actualHours ?? 0;

  const handleOk = async () => {
    if (!task) return;
    const values = await form.validateFields();
    const actor = employeeCode || parseCookies().employeeCode || parseCookies().rl_user_id || parseCookies().user || '';
    if (!actor) return;
    await extendTask(
      project!.handle,
      {
        taskHandle: task.handle,
        additionalHours: values.additionalHours,
        newProjectEndDate: values.extendEndDate && values.newProjectEndDate ? values.newProjectEndDate.format('YYYY-MM-DD') : undefined,
        reason: values.reason,
      },
      actor,
    );
    onClose();
  };

  const additional = Form.useWatch('additionalHours', form) ?? 0;
  const extendEndDate = Form.useWatch('extendEndDate', form);

  return (
    <Modal
      open={open}
      title={`Extend task: ${task?.taskName ?? ''}`}
      onOk={handleOk}
      onCancel={onClose}
      okText="Extend"
      destroyOnClose
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 12 }}
        message={`This task has used ${actual} h of its ${est} h estimate. Extending adds hours to the task estimate and rolls the increase into the project estimate. The extension is recorded.`}
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="additionalHours"
          label="Additional hours"
          rules={[{ required: true, type: 'number', min: 0.5, message: 'Enter hours to add' }]}
        >
          <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
        </Form.Item>
        {additional > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            New task estimate: <strong>{est + additional} h</strong>
            {project?.estimateHours != null && <> · new project estimate: <strong>{project.estimateHours + additional} h</strong></>}
          </Text>
        )}
        <Form.Item name="extendEndDate" label="Also push the project end date" valuePropName="checked" style={{ marginTop: 12 }}>
          <Switch />
        </Form.Item>
        {extendEndDate && (
          <Form.Item
            name="newProjectEndDate"
            label="New project end date"
            rules={[{ required: true, message: 'Pick the new end date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => !!project?.endDate && d.isBefore(dayjs(project.endDate), 'day')}
            />
          </Form.Item>
        )}
        <Form.Item name="reason" label="Reason (recorded)" rules={[{ required: true, message: 'A reason is required for the audit trail' }]}>
          <Input.TextArea rows={2} placeholder="e.g. scope grew, extra rework" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
