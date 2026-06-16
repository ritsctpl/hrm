'use client';
import { useEffect, useState } from 'react';
import { Modal, Form, Input, Alert, Typography, message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import type { Project } from '../../types/domain.types';

const { Text } = Typography;

interface Props {
  open: boolean;
  project: Project | null;
  onClose: () => void;
}

export default function ChangeManagerModal({ open, project, onClose }: Props) {
  const [form] = Form.useForm<{ reason?: string }>();
  const { savingProject } = useHrmProjectStore();
  const { changeProjectManager } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();

  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [newPmId, setNewPmId] = useState('');
  const [newPmName, setNewPmName] = useState('');

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
      setNewPmId('');
      setNewPmName('');
    }
  }, [open]);

  const handleOk = async () => {
    if (!project) return;
    const values = await form.validateFields();
    if (!newPmId) {
      message.error('Select the new project manager.');
      return;
    }
    if (newPmId === project.projectManagerId) {
      message.error('Pick a different manager.');
      return;
    }
    const actor =
      employeeCode || parseCookies().employeeCode || parseCookies().rl_user_id || parseCookies().user || '';
    if (!actor) {
      message.error('Could not identify the signed-in user — please sign in again');
      return;
    }
    await changeProjectManager(
      project.handle,
      { newProjectManagerId: newPmId, newProjectManagerName: newPmName, reason: values.reason },
      actor,
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Change project manager"
      onOk={handleOk}
      onCancel={onClose}
      okText="Change manager"
      confirmLoading={savingProject}
      destroyOnClose
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Current manager</Text>
        <div><Text strong>{project?.projectManagerName || project?.projectManagerId || '—'}</Text></div>
      </div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Pending allocation approvals on this project move to the new manager's queue."
      />
      <Form form={form} layout="vertical">
        <Form.Item label="New manager" required>
          <HrmEmployeePicker
            value={newPmId}
            loading={loadingEmployees}
            options={employees
              .filter((e) => e.employeeCode !== project?.projectManagerId)
              .map((e) => ({ handle: e.employeeCode, name: e.fullName, employeeCode: e.employeeCode }))}
            onSelect={(emp) => { setNewPmId(emp.employeeCode); setNewPmName(emp.name); }}
          />
        </Form.Item>
        <Form.Item name="reason" label="Reason / remarks">
          <Input.TextArea rows={2} placeholder="e.g. handover, manager change" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
