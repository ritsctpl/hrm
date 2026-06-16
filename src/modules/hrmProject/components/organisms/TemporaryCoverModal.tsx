'use client';
import { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Input, Alert, Typography, Tag, message } from 'antd';
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
const { RangePicker } = DatePicker;

interface Props {
  open: boolean;
  allocation: ResourceAllocation | null;
  projectHandle: string;
  onClose: () => void;
}

export default function TemporaryCoverModal({ open, allocation, projectHandle, onClose }: Props) {
  const [form] = Form.useForm<{ range: [dayjs.Dayjs, dayjs.Dayjs]; remarks?: string }>();
  const { savingAllocation } = useHrmProjectStore();
  const { temporaryCover } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();

  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [coverId, setCoverId] = useState('');
  const [coverName, setCoverName] = useState('');

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
      setCoverId('');
      setCoverName('');
    }
  }, [open]);

  const handleOk = async () => {
    if (!allocation) return;
    const values = await form.validateFields();
    if (!coverId) { message.error('Select who will cover.'); return; }
    if (coverId === allocation.employeeId) { message.error('Pick a different person to cover.'); return; }
    const actor = employeeCode || parseCookies().employeeCode || parseCookies().rl_user_id || parseCookies().user || '';
    if (!actor) { message.error('Could not identify the signed-in user — please sign in again'); return; }
    const [from, to] = values.range;
    await temporaryCover(
      projectHandle,
      {
        allocationHandle: allocation.handle,
        coverEmployeeId: coverId,
        coverEmployeeName: coverName,
        coverFrom: from.format('YYYY-MM-DD'),
        coverTo: to.format('YYYY-MM-DD'),
        remarks: values.remarks,
      },
      actor,
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Temporary cover"
      onOk={handleOk}
      onCancel={onClose}
      okText="Create cover"
      confirmLoading={savingAllocation}
      destroyOnClose
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong>{allocation?.employeeName}</Text>{' '}
        {allocation?.taskName ? <Tag color="blue">{allocation.taskName}</Tag> : <Tag>Project member</Tag>}
        <div><Text type="secondary" style={{ fontSize: 12 }}>is being covered for a period</Text></div>
      </div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="The cover person takes this work for the chosen window only. The original allocation stays — it resumes automatically when the cover window ends."
      />
      <Form form={form} layout="vertical">
        <Form.Item label="Cover person" required>
          <HrmEmployeePicker
            value={coverId}
            loading={loadingEmployees}
            options={employees
              .filter((e) => e.employeeCode !== allocation?.employeeId)
              .map((e) => ({ handle: e.employeeCode, name: e.fullName, employeeCode: e.employeeCode }))}
            onSelect={(emp) => { setCoverId(emp.employeeCode); setCoverName(emp.name); }}
          />
        </Form.Item>
        <Form.Item name="range" label="Cover period" rules={[{ required: true, message: 'Pick the cover period' }]}>
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="remarks" label="Reason / remarks">
          <Input.TextArea rows={2} placeholder="e.g. annual leave, sick cover" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
