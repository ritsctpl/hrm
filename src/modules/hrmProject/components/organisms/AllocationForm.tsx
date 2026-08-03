'use client';
import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Checkbox, Radio, Switch, Button, Space, Divider, Select, Table, Avatar, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { RECURRENCE_PATTERNS, WEEKDAYS, BOOKING_TYPES, MAX_HOURS_PER_DAY, HOURS_STEP } from '../../utils/projectConstants';
import type { AllocationFormValues } from '../../types/ui.types';
import Can from '../../../hrmAccess/components/Can';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import styles from '../../styles/AllocationForm.module.css';

const { Text } = Typography;

interface Props {
  projectHandle: string;
}

export default function AllocationForm({ projectHandle }: Props) {
  const [form] = Form.useForm<AllocationFormValues>();
  const { savingAllocation, closeAllocationForm, projectAllocations, selectedProject, allocationPrefill } = useHrmProjectStore();
  const { createAllocations } = useProjectMutations();
  const { employeeCode, isReady } = useEmployeeIdentity();

  const watchEmployee = Form.useWatch('employeeId', form);
  const watchStart = Form.useWatch('startDate', form);

  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  // Assign-task mode (PRD): checkbox task matrix with filter + search
  const [taskFilter, setTaskFilter] = useState<'UNASSIGNED' | 'ASSIGNED' | 'ALL'>('UNASSIGNED');
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedTaskKeys, setSelectedTaskKeys] = useState<string[]>([]);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoadingEmployees(true);
    HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 })
      .then((res) => setEmployees(res?.employees ?? []))
      .catch(() => message.error('Failed to load employees'))
      .finally(() => setLoadingEmployees(false));
  }, []);

  // Pre-fill the employee when opened via "Assign Task" on a team member
  useEffect(() => {
    if (allocationPrefill) {
      form.setFieldValue('employeeId', allocationPrefill.employeeId);
      setSelectedEmployeeName(allocationPrefill.employeeName);
      setSelectedTaskKeys([]);
      setTaskFilter('UNASSIGNED');
      setTaskSearch('');
    }
  }, [allocationPrefill]);

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

    const isTaskMode = !!allocationPrefill;
    const taskIds = isTaskMode ? selectedTaskKeys : (values.taskIds ?? []);
    if (isTaskMode && taskIds.length === 0) {
      message.error('Select at least one task to assign.');
      return;
    }
    // In task-assign mode the employee field is hidden, so it is not in the form values —
    // take it from the prefill instead.
    const employeeId = isTaskMode ? (allocationPrefill?.employeeId ?? '') : values.employeeId;

    // Dates: task-assign mode inherits the member's project-allocation window; the normal
    // "Add Allocation" flow takes the dates from the form.
    const startStr = isTaskMode ? (allocationPrefill?.startDate ?? '') : dayjs(values.startDate).format('YYYY-MM-DD');
    const endStr = isTaskMode ? (allocationPrefill?.endDate ?? '') : dayjs(values.endDate).format('YYYY-MM-DD');
    const s1 = dayjs(startStr);
    const e1 = dayjs(endStr);
    if (s1.isValid() && e1.isValid() && e1.isBefore(s1, 'day')) {
      message.error('End date cannot be before start date.');
      return;
    }
    const isProjectLevel = (a: typeof projectAllocations[number]) => !a.taskId;
    const isActive = (a: typeof projectAllocations[number]) => a.status !== 'CANCELLED' && a.status !== 'REJECTED';

    // FE-5: assigning to tasks needs the employee already on the project (project-level allocation).
    // Skip the pre-check if allocations aren't loaded yet — the backend (PRJ_036) is the source of truth.
    if (taskIds.length && projectAllocations.length > 0) {
      const onProject = projectAllocations.some((a) => a.employeeId === employeeId && isProjectLevel(a) && isActive(a));
      if (!onProject) {
        message.error('Add this employee to the project first (allocate with no task selected), then assign tasks.');
        return;
      }
    }

    // FE-2: block targets the employee is already allocated to (overlapping dates)
    const targetIds: (string | null)[] = taskIds.length ? taskIds : [null];
    const overlapsExisting = (tid: string | null) => projectAllocations.some((a) => {
      if (a.employeeId !== employeeId || !isActive(a)) return false;
      const aTask = a.taskId ? a.taskId : null;
      if (aTask !== tid) return false;
      const s2 = dayjs(a.startDate);
      const e2 = dayjs(a.endDate);
      return !s1.isAfter(e2) && !s2.isAfter(e1);
    });
    const dupes = targetIds.filter(overlapsExisting);
    if (dupes.length) {
      const names = dupes.map((id) => (id ? (selectedProject?.tasks?.find((t) => t.handle === id)?.taskName ?? 'a task') : 'project-level'));
      message.error(`${selectedEmployeeName || 'This employee'} is already allocated to: ${names.join(', ')}.`);
      return;
    }

    const recurring = isTaskMode ? false : !!values.recurring;
    const prepared: AllocationFormValues = {
      ...values,
      employeeId,
      employeeName: selectedEmployeeName,
      role: isTaskMode ? (allocationPrefill?.role || 'Member') : values.role,
      bookingType: isTaskMode ? ((allocationPrefill?.bookingType as 'FIRM' | 'TENTATIVE') || 'FIRM') : values.bookingType,
      // Assigning tasks records what the member works on, not for how long — the hours
      // stay on their project-level allocation and are not split across tasks.
      hoursPerDay: isTaskMode ? 0 : values.hoursPerDay,
      startDate: startStr,
      endDate: endStr,
      recurring,
      recurrencePattern: recurring ? (values.recurrencePattern ?? 'WEEKLY') : null,
      recurrenceDays: recurring ? (values.recurrenceDays ?? []) : [],
    };
    const assignments = taskIds.length
      ? taskIds.map((id) => {
          const task = selectedProject?.tasks?.find((t) => t.handle === id);
          return { taskId: id, billableRate: task?.billableRate ?? values.billableRate };
        })
      : [{ taskId: null as string | null, billableRate: values.billableRate }];

    await createAllocations(projectHandle, prepared, assignments, actor);
  };

  // Opened via "Assign Task" on a team member → focused, task-only layout.
  const isTaskMode = !!allocationPrefill;
  // Resource meta + task matrix data for assign-task mode
  const empRow = employees.find((e) => e.employeeCode === allocationPrefill?.employeeId);
  const assignedTaskIds = new Set(
    projectAllocations
      .filter((a) => a.employeeId === allocationPrefill?.employeeId && a.taskId && a.status !== 'CANCELLED' && a.status !== 'REJECTED')
      .map((a) => a.taskId as string)
  );
  const filteredTasks = (selectedProject?.tasks ?? []).filter((t) => {
    const assigned = assignedTaskIds.has(t.handle);
    if (taskFilter === 'UNASSIGNED' && assigned) return false;
    if (taskFilter === 'ASSIGNED' && !assigned) return false;
    if (taskSearch && !t.taskName.toLowerCase().includes(taskSearch.toLowerCase())) return false;
    return true;
  });

  // Tasks can only be assigned once the employee is already on the project (a
  // project-level allocation with no task). Until then the task picker stays disabled.
  const employeeOnProject = isTaskMode || (!!watchEmployee && projectAllocations.some(
    (a) => a.employeeId === watchEmployee && !a.taskId && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
  ));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ bookingType: 'FIRM', recurring: false, recurrencePattern: 'WEEKLY' }}
    >
      {isTaskMode && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '4px 0 12px', borderBottom: '1px solid #f0f0f0', marginBottom: 12 }}>
          <Avatar src={empRow?.photoUrl} size={44}>{(selectedEmployeeName || '?').charAt(0)}</Avatar>
          <div>
            <div><Text strong>{selectedEmployeeName}</Text></div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {allocationPrefill?.employeeId}{empRow?.role ? ` · ${empRow.role}` : ''}
            </Text>
          </div>
        </div>
      )}

      {!isTaskMode && <Divider orientation="left">Allocation Details</Divider>}

      {!isTaskMode && (
        <>
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
        </>
      )}

      {isTaskMode ? (
        <Form.Item label="Tasks" required style={{ marginBottom: 12 }}>
          <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
            <Radio.Group value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} optionType="button" size="small">
              <Radio.Button value="UNASSIGNED">Unassigned</Radio.Button>
              <Radio.Button value="ASSIGNED">Assigned</Radio.Button>
              <Radio.Button value="ALL">All</Radio.Button>
            </Radio.Group>
            <Input.Search placeholder="Search by Task" allowClear value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} style={{ width: 180 }} />
          </Space>
          <Table
            rowKey="handle"
            size="small"
            dataSource={filteredTasks}
            pagination={false}
            scroll={{ y: 240 }}
            rowSelection={{
              selectedRowKeys: selectedTaskKeys,
              onChange: (keys) => setSelectedTaskKeys(keys as string[]),
              getCheckboxProps: (t) => ({ disabled: assignedTaskIds.has(t.handle) }),
            }}
            columns={[
              {
                title: 'Task', dataIndex: 'taskName', key: 'taskName',
                render: (n: string, t) => (
                  <span>{n}{assignedTaskIds.has(t.handle) && <Text type="secondary" style={{ fontSize: 11 }}> · assigned</Text>}</span>
                ),
              },
              { title: 'Est. hrs', dataIndex: 'estimatedHours', key: 'estimatedHours', width: 90, align: 'right' },
            ]}
            locale={{ emptyText: 'No tasks' }}
          />
        </Form.Item>
      ) : (
        <Form.Item
          name="taskIds"
          label="Tasks (optional)"
          tooltip="Assign the employee to specific tasks. Available only after the employee is on the project."
          extra={
            watchEmployee && !employeeOnProject
              ? 'Add this employee to the project first — save this allocation with no task, then reopen to assign tasks.'
              : undefined
          }
        >
          <Select
            mode="multiple"
            allowClear
            disabled={!employeeOnProject}
            placeholder={employeeOnProject ? 'Pick one or more tasks' : 'Add employee to the project first (save with no task)'}
            optionFilterProp="label"
            options={(selectedProject?.tasks ?? []).map((t) => ({ value: t.handle, label: t.taskName }))}
          />
        </Form.Item>
      )}
      <Space style={{ display: 'flex' }}>
        <Form.Item name="billableRate" label="Billable Rate / hr" style={{ flex: 1 }}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="costRate" label="Cost Rate / hr" style={{ flex: 1 }}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Space>
      {isTaskMode ? (
        <div style={{ marginBottom: 12, fontSize: 12, color: '#8c8c8c' }}>
          Pick the tasks this member will work on. Their hours stay on the project allocation —
          assigning a task does not book any time against it.
        </div>
      ) : (
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
      )}
      {!isTaskMode && (
        <Space style={{ display: 'flex' }}>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]} style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" rules={[{ required: true }]} style={{ flex: 1 }}>
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => !!watchStart && d.isBefore(dayjs(watchStart), 'day')}
            />
          </Form.Item>
        </Space>
      )}

      {!isTaskMode && (
        <>
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
        </>
      )}

      <div className={styles.formActions}>
        <Button onClick={closeAllocationForm}>Cancel</Button>
        <Can I="add">
          <Button type="primary" htmlType="submit" loading={savingAllocation}>
            {isTaskMode ? 'Assign Tasks' : 'Submit for Approval'}
          </Button>
        </Can>
      </div>
    </Form>
  );
}
