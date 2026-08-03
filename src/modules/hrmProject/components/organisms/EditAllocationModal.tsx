'use client';
import { useEffect } from 'react';
import { Modal, Form, InputNumber, DatePicker, Alert, Typography, Tag, message } from 'antd';
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

/**
 * Corrects an allocation that has not been approved yet.
 *
 * Deliberately separate from Revise: the server only accepts this on DRAFT and
 * REJECTED rows, and it saves the change without sending anything for
 * approval. Revising an approved allocation is a different act — it costs
 * someone another decision — so the two are not merged behind one button.
 *
 * Start date is editable here and not in Revise, because a draft has not
 * committed anyone's time yet.
 */
export default function EditAllocationModal({ open, allocation, projectHandle, onClose }: Props) {
  const [form] = Form.useForm<{
    hoursPerDay: number;
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
    billableRate?: number;
  }>();
  const { savingAllocation } = useHrmProjectStore();
  const { updateAllocation } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();

  useEffect(() => {
    if (open && allocation) {
      form.setFieldsValue({
        hoursPerDay: allocation.hoursPerDay,
        startDate: allocation.startDate ? dayjs(allocation.startDate) : undefined,
        endDate: allocation.endDate ? dayjs(allocation.endDate) : undefined,
        billableRate: allocation.billableRate ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    await updateAllocation(
      projectHandle,
      {
        handle: allocation.handle,
        hoursPerDay: values.hoursPerDay,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        billableRate: values.billableRate ?? null,
      },
      actor,
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Edit allocation"
      okText="Save"
      confirmLoading={savingAllocation}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong>{allocation?.employeeName}</Text>{' '}
        {allocation?.taskName ? <Tag color="blue">{allocation.taskName}</Tag> : <Tag>Project member</Tag>}
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="This allocation has not been approved yet, so the change is saved directly. It still needs submitting when you are ready."
      />

      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="hoursPerDay"
          label="Hours per day"
          rules={[{ required: true, message: 'Hours per day is required' }]}
        >
          <InputNumber min={HOURS_STEP} max={MAX_HOURS_PER_DAY} step={HOURS_STEP} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="startDate" label="Start date" rules={[{ required: true, message: 'Start date is required' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="End date"
          dependencies={['startDate']}
          rules={[
            { required: true, message: 'End date is required' },
            ({ getFieldValue }) => ({
              validator: (_, v) =>
                !v || !getFieldValue('startDate') || !v.isBefore(getFieldValue('startDate'), 'day')
                  ? Promise.resolve()
                  : Promise.reject(new Error('End date cannot be before the start date')),
            }),
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(d) => {
              const start = form.getFieldValue('startDate');
              return !!start && d.isBefore(start, 'day');
            }}
          />
        </Form.Item>

        <Form.Item name="billableRate" label="Billable rate / hr">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
