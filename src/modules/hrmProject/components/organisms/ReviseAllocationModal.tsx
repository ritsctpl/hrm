'use client';
import { useEffect } from 'react';
import { Modal, Form, InputNumber, DatePicker, Input, Alert, Typography, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { MAX_HOURS_PER_DAY, HOURS_STEP } from '../../utils/projectConstants';
import type { ResourceAllocation } from '../../types/domain.types';

const { Text } = Typography;

interface Props {
  open: boolean;
  allocation: ResourceAllocation | null;
  projectHandle: string;
  onClose: () => void;
}

export default function ReviseAllocationModal({ open, allocation, projectHandle, onClose }: Props) {
  const [form] = Form.useForm<{ hoursPerDay: number; endDate: dayjs.Dayjs; billableRate?: number; remarks?: string }>();
  const { savingAllocation } = useHrmProjectStore();
  const { reviseAllocation } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();

  useEffect(() => {
    if (open && allocation) {
      form.setFieldsValue({
        hoursPerDay: allocation.hoursPerDay,
        endDate: allocation.endDate ? dayjs(allocation.endDate) : undefined,
        billableRate: allocation.billableRate ?? undefined,
      });
    }
  }, [open, allocation]);

  const handleOk = async () => {
    if (!allocation) return;
    const values = await form.validateFields();
    const actor =
      employeeCode || parseCookies().employeeCode || parseCookies().rl_user_id || parseCookies().user || '';
    if (!actor) {
      message.error('Could not identify the signed-in user — please sign in again');
      return;
    }
    const endDate = values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined;
    const noChange =
      values.hoursPerDay === allocation.hoursPerDay &&
      endDate === allocation.endDate &&
      (values.billableRate ?? null) === (allocation.billableRate ?? null);
    if (noChange) {
      message.info('Nothing changed.');
      return;
    }
    await reviseAllocation(
      projectHandle,
      { allocationHandle: allocation.handle, hoursPerDay: values.hoursPerDay, endDate, billableRate: values.billableRate ?? null, remarks: values.remarks },
      actor,
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Edit / extend allocation"
      onOk={handleOk}
      onCancel={onClose}
      okText="Save & resubmit"
      confirmLoading={savingAllocation}
      destroyOnClose
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong>{allocation?.employeeName}</Text>{' '}
        {allocation?.taskName ? <Tag color="blue">{allocation.taskName}</Tag> : <Tag>Project member</Tag>}
        <div><Text type="secondary" style={{ fontSize: 12 }}>Current: {allocation?.hoursPerDay} h/day · ends {allocation?.endDate}</Text></div>
      </div>

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 12 }}
        message="Editing an approved allocation sends it back for approval. The end date cannot be earlier than days that already have logged timesheet hours."
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="hoursPerDay"
          label="Hours / Day"
          rules={[
            { required: true, type: 'number', min: HOURS_STEP, max: MAX_HOURS_PER_DAY },
            { validator: (_, v) => (v == null || (Number(v) * 10) % 5 === 0 ? Promise.resolve() : Promise.reject(new Error('Must be a multiple of 0.5'))) },
          ]}
        >
          <InputNumber min={HOURS_STEP} max={MAX_HOURS_PER_DAY} step={HOURS_STEP} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="endDate"
          label="End Date"
          rules={[
            { required: true },
            {
              validator: (_, v) =>
                !v || !allocation?.startDate || !v.isBefore(dayjs(allocation.startDate), 'day')
                  ? Promise.resolve()
                  : Promise.reject(new Error('End date cannot be before the start date')),
            },
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(d) => !!allocation?.startDate && d.isBefore(dayjs(allocation.startDate), 'day')}
          />
        </Form.Item>
        <Form.Item name="billableRate" label="Billable Rate / hr">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="remarks" label="Reason / remarks">
          <Input.TextArea rows={2} placeholder="e.g. extended timeline, scope change" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
