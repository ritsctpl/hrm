'use client';

import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Spin, Empty, message, InputNumber, Form, Input, DatePicker } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { EmployeeProfile, Remuneration } from '../../types/domain.types';

interface Props {
  profile: EmployeeProfile;
  onRefresh: () => void;
}

const RemunerationTab: React.FC<Props> = ({ profile, onRefresh }) => {
  const [remuneration, setRemuneration] = useState<Remuneration | null>(profile.remuneration ?? null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!profile.remuneration && profile.handle) {
      setLoading(true);
      const cookies = parseCookies();
      const site = cookies.site;
      if (site) {
        HrmEmployeeService.fetchRemuneration(site, profile.handle)
          .then((data) => setRemuneration(data))
          .catch(() => {
            // No remuneration data yet
          })
          .finally(() => setLoading(false));
      }
    }
  }, [profile.handle, profile.remuneration]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const cookies = parseCookies();
      const site = cookies.site;
      const modifiedBy = cookies.username || 'system';
      await HrmEmployeeService.updateRemuneration(site, profile.handle, values, modifiedBy);
      message.success('Remuneration updated');
      setEditing(false);
      setRemuneration(values);
      onRefresh();
    } catch {
      // validation or API error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>;
  }

  if (!remuneration && !editing) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="No remuneration data available">
          <Button type="primary" onClick={() => { setEditing(true); form.resetFields(); }}>
            Set Remuneration
          </Button>
        </Empty>
      </div>
    );
  }

  if (editing) {
    return (
      <div style={{ padding: 16, maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={remuneration ?? {
            currency: 'INR',
            basicPay: 0,
            hra: 0,
            transport: 0,
            otherAllowances: 0,
            pfDeduction: 0,
            tax: 0,
            otherDeductions: 0,
            ctc: 0,
            effectiveFrom: '',
            payrollGrade: '',
            approvedBy: '',
          }}
        >
          <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
            <Input placeholder="INR" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="basicPay" label="Basic Pay" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="hra" label="HRA">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="transport" label="Transport">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="otherAllowances" label="Other Allowances">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="pfDeduction" label="PF Deduction">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="tax" label="Tax">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="otherDeductions" label="Other Deductions">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="ctc" label="CTC (Annual)" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
          <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="payrollGrade" label="Payroll Grade">
            <Input placeholder="e.g., L5" />
          </Form.Item>
          <Form.Item name="approvedBy" label="Approved By">
            <Input placeholder="Approver name" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Save
            </Button>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </Form>
      </div>
    );
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-IN').format(v);

  return (
    <div style={{ padding: 16 }}>
      <Card
        size="small"
        title="Salary Breakdown"
        extra={
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(true); form.setFieldsValue(remuneration); }}>
            Update
          </Button>
        }
      >
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Currency">{remuneration!.currency}</Descriptions.Item>
          <Descriptions.Item label="CTC (Annual)">{fmt(remuneration!.ctc)}</Descriptions.Item>
          <Descriptions.Item label="Basic Pay">{fmt(remuneration!.basicPay)}</Descriptions.Item>
          <Descriptions.Item label="HRA">{fmt(remuneration!.hra)}</Descriptions.Item>
          <Descriptions.Item label="Transport">{fmt(remuneration!.transport)}</Descriptions.Item>
          <Descriptions.Item label="Other Allowances">{fmt(remuneration!.otherAllowances)}</Descriptions.Item>
          <Descriptions.Item label="PF Deduction">{fmt(remuneration!.pfDeduction)}</Descriptions.Item>
          <Descriptions.Item label="Tax">{fmt(remuneration!.tax)}</Descriptions.Item>
          <Descriptions.Item label="Other Deductions">{fmt(remuneration!.otherDeductions)}</Descriptions.Item>
          <Descriptions.Item label="Effective From">{remuneration!.effectiveFrom}</Descriptions.Item>
          <Descriptions.Item label="Payroll Grade">{remuneration!.payrollGrade || '--'}</Descriptions.Item>
          <Descriptions.Item label="Approved By">{remuneration!.approvedBy || '--'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default RemunerationTab;
