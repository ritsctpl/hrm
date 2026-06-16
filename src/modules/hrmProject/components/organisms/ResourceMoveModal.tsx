'use client';
import { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Input, Alert, Avatar, Typography, Space, message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import type { ResourceAllocation } from '../../types/domain.types';

const { Text } = Typography;

interface Props {
  open: boolean;
  mode: 'reassign' | 'replace' | 'release';
  // reassign: the single (task) allocation being moved.
  // replace / release: the member's membership allocation (source of the employee + name).
  allocation: ResourceAllocation | null;
  taskCount?: number; // replace/release mode: how many task allocations are affected
  projectHandle: string;
  onClose: () => void;
}

export default function ResourceMoveModal({ open, mode, allocation, taskCount = 0, projectHandle, onClose }: Props) {
  const [form] = Form.useForm<{ effectiveDate: dayjs.Dayjs; remarks?: string }>();
  const { savingAllocation } = useHrmProjectStore();
  const { reassignAllocation, replaceMember, releaseMember } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();

  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');

  useEffect(() => {
    if (!open) return;
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoadingEmployees(true);
    HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 })
      .then((res) => setEmployees(res?.employees ?? []))
      .catch(() => message.error('Failed to load employees'))
      .finally(() => setLoadingEmployees(false));
  }, [open]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue('effectiveDate', dayjs());
      setNewEmpId('');
      setNewEmpName('');
    }
  }, [open]);

  const isReassign = mode === 'reassign';
  const isRelease = mode === 'release';
  const title = isReassign
    ? `Reassign task: ${allocation?.taskName ?? ''}`
    : isRelease
      ? `Release member: ${allocation?.employeeName ?? ''}`
      : `Replace member: ${allocation?.employeeName ?? ''}`;

  const handleOk = async () => {
    const values = await form.validateFields();
    if (!isRelease) {
      if (!newEmpId) {
        message.error('Select who to move this to.');
        return;
      }
      if (newEmpId === allocation?.employeeId) {
        message.error('Pick a different employee.');
        return;
      }
    }
    const actor =
      employeeCode ||
      parseCookies().employeeCode ||
      parseCookies().rl_user_id ||
      parseCookies().user ||
      '';
    if (!actor) {
      message.error('Could not identify the signed-in user — please sign in again');
      return;
    }
    const effectiveDate = values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : undefined;
    if (!allocation) return;

    if (isReassign) {
      await reassignAllocation(
        projectHandle,
        { allocationHandle: allocation.handle, newEmployeeId: newEmpId, newEmployeeName: newEmpName, effectiveDate, remarks: values.remarks },
        actor,
      );
    } else if (isRelease) {
      await releaseMember(
        projectHandle,
        { employeeId: allocation.employeeId, effectiveDate, remarks: values.remarks },
        actor,
      );
    } else {
      await replaceMember(
        projectHandle,
        { outgoingEmployeeId: allocation.employeeId, incomingEmployeeId: newEmpId, incomingEmployeeName: newEmpName, effectiveDate, remarks: values.remarks },
        actor,
      );
    }
    onClose();
  };

  const empRow = employees.find((e) => e.employeeCode === allocation?.employeeId);

  return (
    <Modal
      open={open}
      title={title}
      onOk={handleOk}
      onCancel={onClose}
      okText={isReassign ? 'Reassign' : isRelease ? 'Release member' : 'Replace member'}
      okButtonProps={isRelease ? { danger: true } : undefined}
      confirmLoading={savingAllocation}
      destroyOnClose
    >
      <Space align="center" style={{ marginBottom: 12 }}>
        <Avatar src={empRow?.photoUrl}>{(allocation?.employeeName ?? '?').charAt(0)}</Avatar>
        <div>
          <div><Text type="secondary" style={{ fontSize: 12 }}>From</Text></div>
          <Text strong>{allocation?.employeeName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}> · {allocation?.employeeId}</Text>
        </div>
      </Space>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={
          isReassign
            ? "Past timesheet hours stay with the current person. The remaining work moves to the new person and goes for approval."
            : isRelease
              ? `This ends the membership${taskCount > 0 ? ` and ${taskCount} task allocation${taskCount === 1 ? '' : 's'}` : ''} from the effective date — no replacement. Past actuals stay with the person; future hours are freed.`
              : `This moves the membership${taskCount > 0 ? ` and ${taskCount} task allocation${taskCount === 1 ? '' : 's'}` : ''} to the new person from the effective date. Past actuals stay with the current person.`
        }
      />

      <Form form={form} layout="vertical">
        {!isRelease && (
          <Form.Item label="Move to" required>
            <HrmEmployeePicker
              value={newEmpId}
              loading={loadingEmployees}
              options={employees
                .filter((e) => e.employeeCode !== allocation?.employeeId)
                .map((e) => ({ handle: e.employeeCode, name: e.fullName, employeeCode: e.employeeCode }))}
              onSelect={(emp) => { setNewEmpId(emp.employeeCode); setNewEmpName(emp.name); }}
            />
          </Form.Item>
        )}
        <Form.Item name="effectiveDate" label="Effective from" rules={[{ required: true, message: 'Pick the effective date' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="remarks" label="Reason / remarks">
          <Input.TextArea rows={2} placeholder="e.g. resource rolled off, leave coverage, rebalancing" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
