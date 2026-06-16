'use client';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Input, Divider, List, Button, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import { HrmProjectService } from '../../services/hrmProjectService';
import type { ApprovalDelegationResponse } from '../../types/api.types';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DelegateApprovalModal({ open, onClose }: Props) {
  const [form] = Form.useForm<{ range: [dayjs.Dayjs, dayjs.Dayjs]; remarks?: string }>();
  const { employeeCode } = useEmployeeIdentity();

  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [toId, setToId] = useState('');
  const [toName, setToName] = useState('');
  const [delegations, setDelegations] = useState<ApprovalDelegationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const actor = () => employeeCode || parseCookies().employeeCode || parseCookies().rl_user_id || parseCookies().user || '';

  const loadList = useCallback(async () => {
    const organizationId = getOrganizationId();
    const me = actor();
    if (!organizationId || !me) return;
    setLoading(true);
    try {
      setDelegations(await HrmProjectService.listDelegations(organizationId, me));
    } catch {
      /* listing is best-effort */
    } finally {
      setLoading(false);
    }
  }, [employeeCode]);

  useEffect(() => {
    if (!open) return;
    const organizationId = getOrganizationId();
    if (organizationId) {
      HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 })
        .then((res) => setEmployees(res?.employees ?? []))
        .catch(() => {/* optional */});
    }
    form.resetFields();
    setToId('');
    setToName('');
    loadList();
  }, [open]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    const me = actor();
    if (!me) { message.error('Could not identify the signed-in user'); return; }
    if (!toId) { message.error('Select who to delegate to.'); return; }
    if (toId === me) { message.error('Pick a different person.'); return; }
    const [from, to] = values.range;
    setSaving(true);
    try {
      await HrmProjectService.createDelegation({
        organizationId: getOrganizationId(),
        fromEmployeeId: me,
        toEmployeeId: toId,
        toEmployeeName: toName,
        fromDate: from.format('YYYY-MM-DD'),
        toDate: to.format('YYYY-MM-DD'),
        delegatedBy: me,
        remarks: values.remarks,
      } as any);
      message.success('Approvals delegated');
      form.resetFields();
      setToId('');
      setToName('');
      await loadList();
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? 'Failed to delegate approvals');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (d: ApprovalDelegationResponse) => {
    const me = actor();
    try {
      await HrmProjectService.cancelDelegation(getOrganizationId(), d.id ?? d.handle ?? '', me);
      message.success('Delegation cancelled');
      await loadList();
    } catch {
      message.error('Failed to cancel delegation');
    }
  };

  return (
    <Modal
      open={open}
      title="Delegate my approvals"
      onCancel={onClose}
      onOk={handleCreate}
      okText="Delegate"
      confirmLoading={saving}
      destroyOnHidden
    >
      <Text type="secondary" style={{ fontSize: 12 }}>
        While you are away, allocation approvals on your projects go to the delegate for the chosen window.
      </Text>
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item label="Delegate to" required>
          <HrmEmployeePicker
            value={toId}
            options={employees
              .filter((e) => e.employeeCode !== actor())
              .map((e) => ({ handle: e.employeeCode, name: e.fullName, employeeCode: e.employeeCode }))}
            onSelect={(emp) => { setToId(emp.employeeCode); setToName(emp.name); }}
          />
        </Form.Item>
        <Form.Item name="range" label="Period" rules={[{ required: true, message: 'Pick the delegation period' }]}>
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="remarks" label="Reason / remarks">
          <Input.TextArea rows={2} placeholder="e.g. on leave" />
        </Form.Item>
      </Form>

      <Divider style={{ margin: '8px 0' }} />
      <Text strong style={{ fontSize: 12 }}>Active delegations</Text>
      <List
        size="small"
        loading={loading}
        dataSource={delegations}
        locale={{ emptyText: 'None' }}
        renderItem={(d) => (
          <List.Item
            actions={[<Button key="cancel" size="small" type="link" danger onClick={() => handleCancel(d)}>Cancel</Button>]}
          >
            <Text>{d.toEmployeeName || d.toEmployeeId}</Text>
            <Tag style={{ marginLeft: 8 }}>{d.fromDate} → {d.toDate}</Tag>
          </List.Item>
        )}
      />
    </Modal>
  );
}
