'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Space, Steps, Radio, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { HrmProjectService } from '../../services/hrmProjectService';
import { CURRENCY_OPTIONS, PROJECT_TYPES } from '../../utils/projectConstants';
import type { ProjectFormValues } from '../../types/ui.types';
import type { ClientResponse } from '../../types/api.types';
import Can from '../../../hrmAccess/components/Can';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import type { BusinessUnit, Department } from '@/modules/hrmOrganization/types/domain.types';
import styles from '../../styles/HrmProject.module.css';

let milestoneKey = 0;

export default function ProjectForm() {
  const [form] = Form.useForm<ProjectFormValues>();
  const { editingProject, closeProjectForm, savingProject, projects } = useHrmProjectStore();
  const { createProject, updateProject } = useProjectMutations();
  const [milestones, setMilestones] = useState(
    editingProject?.milestones.map((m) => ({ key: m.milestoneId, ...m })) ?? []
  );

  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loadingBUs, setLoadingBUs] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [step, setStep] = useState(0);
  // Dates are kept in local state (not Form-bound) so the latest picked value is
  // always submitted — avoids stale-value issues when the field sits in a hidden step.
  const [startDate, setStartDate] = useState<Dayjs | null>(
    editingProject?.startDate ? dayjs(editingProject.startDate) : null
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    editingProject?.endDate ? dayjs(editingProject.endDate) : null
  );

  const watchBuCode = Form.useWatch('buCode', form);
  const watchPm = Form.useWatch('projectManagerId', form);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoadingEmployees(true);
    HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 })
      .then((res) => setEmployees(res?.employees ?? []))
      .catch(() => message.error('Failed to load employees'))
      .finally(() => setLoadingEmployees(false));
    setLoadingBUs(true);
    HrmOrganizationService.fetchBusinessUnitsBySite(organizationId)
      .then((data) => setBusinessUnits(data ?? []))
      .catch(() => message.error('Failed to load business units'))
      .finally(() => setLoadingBUs(false));
    setLoadingClients(true);
    HrmProjectService.listClients(organizationId)
      .then((data) => setClients(data ?? []))
      .catch(() => message.error('Failed to load clients'))
      .finally(() => setLoadingClients(false));
  }, []);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId || !watchBuCode) {
      setDepartments([]);
      return;
    }
    const bu = businessUnits.find((b) => b.buCode === watchBuCode);
    if (!bu?.handle) {
      setDepartments([]);
      return;
    }
    setLoadingDepts(true);
    HrmOrganizationService.fetchDepartments(organizationId, bu.handle)
      .then((data) => setDepartments(data ?? []))
      .catch(() => message.error('Failed to load departments'))
      .finally(() => setLoadingDepts(false));
  }, [watchBuCode, businessUnits]);

  const handleSubmit = async (values: ProjectFormValues) => {
    const formValues: ProjectFormValues = {
      ...values,
      startDate: startDate ? startDate.format('YYYY-MM-DD') : '',
      endDate: endDate ? endDate.format('YYYY-MM-DD') : '',
      milestones: milestones.map((m) => ({
        key: m.key,
        milestoneName: m.milestoneName,
        targetDate: m.targetDate,
        description: m.description ?? '',
      })),
    };
    const userId = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    if (editingProject) {
      await updateProject(editingProject.handle, formValues, userId);
    } else {
      // Block duplicate project names within the org before hitting the service
      const name = formValues.projectName.trim().toLowerCase();
      const isDuplicate = projects.some((p) => p.projectName?.trim().toLowerCase() === name);
      if (isDuplicate) {
        message.error('A project with this name already exists');
        setStep(0);
        form.scrollToField('projectName');
        return;
      }
      await createProject(formValues, userId);
    }
  };

  const addMilestone = () => {
    milestoneKey += 1;
    setMilestones((prev) => [
      ...prev,
      { key: `new-${milestoneKey}`, milestoneId: '', milestoneName: '', targetDate: '', description: '', status: 'NOT_STARTED' as const },
    ]);
  };

  // Form-bound fields validated before leaving each step (dates handled separately
  // via local state; step 2 = milestones, optional)
  const STEP_FIELDS: Record<number, (keyof ProjectFormValues)[]> = {
    0: ['projectName', 'projectType', 'buCode', 'projectManagerId'],
    1: ['estimateHours'],
  };

  const goNext = async () => {
    try {
      await form.validateFields(STEP_FIELDS[step] ?? []);
    } catch {
      return; /* validation errors are shown inline on the fields */
    }
    if (step === 1) {
      if (!startDate || !endDate) {
        message.error('Start and End date are required');
        return;
      }
      if (endDate.isBefore(startDate, 'day')) {
        message.error('End date cannot be before start date');
        return;
      }
    }
    setStep((s) => Math.min(2, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={editingProject ? {
        projectName: editingProject.projectName,
        projectType: editingProject.projectType,
        baseProjectHandle: editingProject.baseProjectHandle,
        clientName: editingProject.clientName,
        clientId: editingProject.clientId,
        currency: editingProject.currency,
        buCode: editingProject.buCode,
        departmentCode: editingProject.departmentCode,
        projectManagerId: editingProject.projectManagerId,
        estimateHours: editingProject.estimateHours,
        description: editingProject.description,
      } : { projectType: 'BILLABLE' }}
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 20 }}
        items={[{ title: 'Details' }, { title: 'Planning' }, { title: 'Milestones' }]}
      />

      <div style={{ display: step === 0 ? 'block' : 'none' }}>
      <Form.Item
        name="projectName"
        label="Project Name"
        rules={[{ required: true }]}
        extra={editingProject ? 'Project name cannot be changed after creation' : undefined}
      >
        <Input placeholder="e.g. Customer Portal V2" disabled={!!editingProject} />
      </Form.Item>
      <Form.Item name="projectType" label="Type" rules={[{ required: true }]}>
        <Radio.Group>
          {PROJECT_TYPES.map((t) => (
            <Radio key={t.value} value={t.value}>{t.label}</Radio>
          ))}
        </Radio.Group>
      </Form.Item>
      <Form.Item name="baseProjectHandle" label="Base Project">
        <Select
          placeholder="Link existing project (optional)"
          showSearch
          allowClear
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={projects
            .filter((p) => p.handle !== editingProject?.handle)
            .map((p) => ({ value: p.handle, label: `${p.projectCode} - ${p.projectName}` }))}
        />
      </Form.Item>
      <Space style={{ display: 'flex' }} align="start">
          <Form.Item name="clientName" label="Client" style={{ flex: 1 }}>
            <Select
              placeholder="Select client"
              loading={loadingClients}
              showSearch
              allowClear
              notFoundContent={loadingClients ? 'Loading…' : 'No clients found'}
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={clients.map((c) => ({
                value: c.name,
                label: `${c.code} - ${c.name}`,
              }))}
              onChange={(name) => {
                const picked = clients.find((c) => c.name === name);
                form.setFieldValue('clientId', picked?.id ?? picked?.handle ?? picked?.code ?? undefined);
              }}
            />
          </Form.Item>
          <Form.Item name="currency" label="Currency" style={{ width: 200 }}>
            <Select
              placeholder="Select currency"
              showSearch
              allowClear
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={CURRENCY_OPTIONS}
            />
          </Form.Item>
        </Space>
      <Form.Item name="clientId" hidden>
        <Input />
      </Form.Item>
      <Space style={{ display: 'flex' }}>
        <Form.Item name="buCode" label="Business Unit" rules={[{ required: true }]} style={{ flex: 1 }}>
          <Select
            placeholder="Select Business Unit"
            loading={loadingBUs}
            showSearch
            allowClear
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={businessUnits.map((bu) => ({
              value: bu.buCode,
              label: `${bu.buCode} - ${bu.buName}`,
            }))}
            onChange={() => form.setFieldValue('departmentCode', undefined)}
          />
        </Form.Item>
        <Form.Item name="departmentCode" label="Department" style={{ flex: 1 }}>
          <Select
            placeholder={watchBuCode ? 'Select Department' : 'Select BU first'}
            loading={loadingDepts}
            showSearch
            allowClear
            disabled={!watchBuCode}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={departments.map((d) => ({
              value: d.deptCode,
              label: `${d.deptCode} - ${d.deptName}`,
            }))}
          />
        </Form.Item>
      </Space>
      <Form.Item name="projectManagerId" label="Project Manager" rules={[{ required: true }]}>
        <HrmEmployeePicker
          value={watchPm}
          loading={loadingEmployees}
          placeholder="Search project manager..."
          options={employees.map((e) => ({
            handle: e.employeeCode,
            name: e.fullName,
            employeeCode: e.employeeCode,
          }))}
          onSelect={(emp) => form.setFieldValue('projectManagerId', emp.employeeCode)}
        />
      </Form.Item>

      </div>

      <div style={{ display: step === 1 ? 'block' : 'none' }}>
      <Form.Item name="estimateHours" label="Estimate Hours" rules={[{ required: true, type: 'number', min: 0 }]}>
        <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
      </Form.Item>
      <Space style={{ display: 'flex' }}>
        <Form.Item label="Start Date" required style={{ flex: 1 }}>
          <DatePicker
            style={{ width: '100%' }}
            value={startDate}
            onChange={(d) => setStartDate(d)}
          />
        </Form.Item>
        <Form.Item label="End Date" required style={{ flex: 1 }}>
          <DatePicker
            style={{ width: '100%' }}
            value={endDate}
            onChange={(d) => setEndDate(d)}
            disabledDate={(d) => !!startDate && d.isBefore(startDate, 'day')}
          />
        </Form.Item>
      </Space>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={3} />
      </Form.Item>

      </div>

      <div style={{ display: step === 2 ? 'block' : 'none' }}>
      <p style={{ color: '#888', marginBottom: 12 }}>
        Add key milestones (optional) — or skip and add them later from the project page.
      </p>
      {milestones.map((m, idx) => (
        <Space key={m.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
          <Input
            placeholder="Milestone name"
            value={m.milestoneName}
            onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, milestoneName: e.target.value } : x))}
            style={{ width: 200 }}
          />
          <DatePicker
            value={m.targetDate ? dayjs(m.targetDate) : null}
            onChange={(d) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, targetDate: d?.format('YYYY-MM-DD') ?? '' } : x))}
          />
          <Input
            placeholder="Description"
            value={m.description}
            onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
            style={{ width: 160 }}
          />
          <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== idx))} />
        </Space>
      ))}
      <Button type="dashed" icon={<PlusOutlined />} onClick={addMilestone} block>
        Add Milestone
      </Button>
      </div>

      <div className={styles.formActions}>
        <Button onClick={closeProjectForm}>Cancel</Button>
        {step > 0 && <Button onClick={goBack}>Back</Button>}
        {step < 2 && (
          <Button type="primary" onClick={goNext}>Next</Button>
        )}
        {step === 2 && (
          <Can I={editingProject ? 'edit' : 'add'}>
            <Button type="primary" htmlType="submit" loading={savingProject}>
              {editingProject ? 'Update Project' : 'Save Project'}
            </Button>
          </Can>
        )}
      </div>
    </Form>
  );
}
