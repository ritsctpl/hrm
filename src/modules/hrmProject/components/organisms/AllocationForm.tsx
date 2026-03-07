'use client';
import { useEffect } from 'react';
import { Form, Select, InputNumber, DatePicker, Checkbox, Radio, Button, Space, Divider, Alert } from 'antd';
import dayjs from 'dayjs';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import CapacityColorDot from '../atoms/CapacityColorDot';
import { RECURRENCE_PATTERNS, WEEKDAYS, MAX_HOURS_PER_DAY, HOURS_STEP } from '../../utils/projectConstants';
import type { AllocationFormValues } from '../../types/ui.types';
import styles from '../../styles/AllocationForm.module.css';

interface Props {
  projectHandle: string;
}

export default function AllocationForm({ projectHandle }: Props) {
  const [form] = Form.useForm<AllocationFormValues>();
  const { capacityCheck, loadingCapacity, savingAllocation, closeAllocationForm } = useHrmProjectStore();
  const { checkCapacity } = useProjectData();
  const { createAllocation } = useProjectMutations();

  const watchEmployee = Form.useWatch('employeeId', form);
  const watchStart = Form.useWatch('startDate', form);
  const watchEnd = Form.useWatch('endDate', form);

  useEffect(() => {
    if (watchEmployee && watchStart && watchEnd) {
      checkCapacity(
        watchEmployee,
        dayjs(watchStart).format('YYYY-MM-DD'),
        dayjs(watchEnd).format('YYYY-MM-DD')
      );
    }
  }, [watchEmployee, watchStart, watchEnd]);

  const handleSubmit = async (values: AllocationFormValues) => {
    await createAllocation(
      projectHandle,
      {
        ...values,
        startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      },
      'current-user'
    );
  };

  const hasConflicts = capacityCheck?.dailyCapacities.some((d) => d.capacityStatus === 'RED') ?? false;

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Divider orientation="left">Allocation Details</Divider>
      <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
        <Select showSearch placeholder="Search employee..." />
      </Form.Item>
      <Form.Item name="hoursPerDay" label="Hours / Day" rules={[{ required: true }]}>
        <InputNumber min={HOURS_STEP} max={MAX_HOURS_PER_DAY} step={HOURS_STEP} style={{ width: '100%' }} />
      </Form.Item>
      <Space style={{ display: 'flex' }}>
        <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="endDate" label="End Date" rules={[{ required: true }]} style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Space>

      <Divider orientation="left">Recurrence</Divider>
      <Form.Item name="recurrencePattern" label="Pattern" initialValue="WEEKDAYS">
        <Radio.Group>
          {RECURRENCE_PATTERNS.map((r) => (
            <Radio key={r.value} value={r.value}>{r.label}</Radio>
          ))}
        </Radio.Group>
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.recurrencePattern !== curr.recurrencePattern}>
        {({ getFieldValue }) =>
          getFieldValue('recurrencePattern') === 'CUSTOM' ? (
            <Form.Item name="recurrenceDays" label="Working Days">
              <Checkbox.Group options={WEEKDAYS} />
            </Form.Item>
          ) : null
        }
      </Form.Item>

      {capacityCheck && (
        <>
          <Divider orientation="left">Capacity Check</Divider>
          {hasConflicts && (
            <Alert type="warning" message="Capacity conflicts detected — some days are over-allocated" showIcon style={{ marginBottom: 8 }} />
          )}
          <div className={styles.capacityTable}>
            {capacityCheck.dailyCapacities.slice(0, 7).map((d) => (
              <div key={d.date} className={styles.capacityRow}>
                <span>{d.date}</span>
                <span>{d.isHoliday ? 'HOLIDAY' : d.isLeave ? 'LEAVE' : `Avail: ${d.availableHours.toFixed(1)}h`}</span>
                <CapacityColorDot status={d.isHoliday || d.isLeave ? 'GREY' : d.capacityStatus} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.formActions}>
        <Button onClick={closeAllocationForm}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={savingAllocation || loadingCapacity}>
          Submit for Approval
        </Button>
      </div>
    </Form>
  );
}
