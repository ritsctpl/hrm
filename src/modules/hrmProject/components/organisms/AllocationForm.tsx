'use client';
import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Checkbox, Radio, Switch, Button, Space, Divider, Alert, message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import CapacityColorDot from '../atoms/CapacityColorDot';
import { RECURRENCE_PATTERNS, WEEKDAYS, BOOKING_TYPES, MAX_HOURS_PER_DAY, HOURS_STEP } from '../../utils/projectConstants';
import type { AllocationFormValues } from '../../types/ui.types';
import Can from '../../../hrmAccess/components/Can';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import styles from '../../styles/AllocationForm.module.css';

interface Props {
  projectHandle: string;
}

export default function AllocationForm({ projectHandle }: Props) {
  const [form] = Form.useForm<AllocationFormValues>();
  const { capacityCheck, loadingCapacity, savingAllocation, closeAllocationForm } = useHrmProjectStore();
  const { checkCapacity } = useProjectData();
  const { createAllocation } = useProjectMutations();
  const { employeeCode, isReady } = useEmployeeIdentity();

  const watchEmployee = Form.useWatch('employeeId', form);
  const watchStart = Form.useWatch('startDate', form);
  const watchEnd = Form.useWatch('endDate', form);

  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoadingEmployees(true);
    HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 })
      .then((res) => setEmployees(res?.employees ?? []))
      .catch(() => message.error('Failed to load employees'))
      .finally(() => setLoadingEmployees(false));
  }, []);

  const watchHours = Form.useWatch('hoursPerDay', form);

  useEffect(() => {
    if (watchEmployee && watchStart && watchEnd) {
      checkCapacity(
        watchEmployee,
        dayjs(watchStart).format('YYYY-MM-DD'),
        dayjs(watchEnd).format('YYYY-MM-DD'),
        typeof watchHours === 'number' ? watchHours : undefined,
      );
    }
  }, [watchEmployee, watchStart, watchEnd, watchHours]);

  const handleSubmit = async (values: AllocationFormValues) => {
    const cookies = parseCookies();
    const actor =
      employeeCode ||
      cookies.employeeCode ||
      cookies.employeeId ||
      cookies.userId ||
      cookies.user ||
      cookies.rl_user_id ||
      '';
    if (!actor) {
      message.error('Could not identify the signed-in user — please sign in again');
      return;
    }
    if (actor.includes('@')) {
      console.warn('[AllocationForm] sending email-shaped actor; backend may reject', { actor, isReady });
    }
    const recurring = !!values.recurring;
    await createAllocation(
      projectHandle,
      {
        ...values,
        employeeName: selectedEmployeeName,
        startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
        recurring,
        recurrencePattern: recurring ? (values.recurrencePattern ?? 'WEEKLY') : null,
        recurrenceDays: recurring ? (values.recurrenceDays ?? []) : [],
      },
      actor,
    );
  };

  const hasConflicts = capacityCheck?.dailyCapacities.some((d) => d.capacityStatus === 'RED') ?? false;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ bookingType: 'FIRM', recurring: false, recurrencePattern: 'WEEKLY' }}
    >
      <Divider orientation="left">Allocation Details</Divider>
      <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
        <HrmEmployeePicker
          value={watchEmployee}
          loading={loadingEmployees}
          options={employees.map((e) => ({
            handle: e.employeeCode,
            name: e.fullName,
            employeeCode: e.employeeCode,
          }))}
          onSelect={(emp) => {
            form.setFieldValue('employeeId', emp.employeeCode);
            setSelectedEmployeeName(emp.name);
          }}
        />
      </Form.Item>
      <Space style={{ display: 'flex' }}>
        <Form.Item name="role" label="Role" rules={[{ required: true }]} style={{ flex: 1 }}>
          <Input placeholder="e.g. Developer, QA Lead" />
        </Form.Item>
        <Form.Item name="bookingType" label="Booking Type" rules={[{ required: true }]} style={{ flex: 1 }}>
          <Radio.Group options={BOOKING_TYPES} optionType="button" buttonStyle="solid" />
        </Form.Item>
      </Space>
      <Form.Item
        name="hoursPerDay"
        label="Hours / Day"
        rules={[
          { required: true, type: 'number', min: HOURS_STEP, max: MAX_HOURS_PER_DAY },
          {
            validator: (_, v) =>
              v == null || (Number(v) * 10) % 5 === 0
                ? Promise.resolve()
                : Promise.reject(new Error('Must be a multiple of 0.5')),
          },
        ]}
      >
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
      <Form.Item name="recurring" label="Recurring" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.recurring !== curr.recurring}>
        {({ getFieldValue }) =>
          getFieldValue('recurring') ? (
            <>
              <Form.Item name="recurrencePattern" label="Pattern" rules={[{ required: true }]}>
                <Radio.Group>
                  {RECURRENCE_PATTERNS.map((r) => (
                    <Radio key={r.value} value={r.value}>{r.label}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
              <Form.Item name="recurrenceDays" label="Working Days" rules={[{ required: true, type: 'array', min: 1, message: 'Pick at least one day' }]}>
                <Checkbox.Group options={WEEKDAYS} />
              </Form.Item>
            </>
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
                <span>{d.holiday ? 'HOLIDAY' : d.leave ? 'LEAVE' : `Avail: ${d.availableHours.toFixed(1)}h`}</span>
                <CapacityColorDot status={d.holiday || d.leave ? 'GREY' : d.capacityStatus} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.formActions}>
        <Button onClick={closeAllocationForm}>Cancel</Button>
        <Can I="add">
          <Button type="primary" htmlType="submit" loading={savingAllocation || loadingCapacity}>
            Submit for Approval
          </Button>
        </Can>
      </div>
    </Form>
  );
}
