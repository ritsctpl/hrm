'use client';

import React, { useCallback, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Divider,
  Button,
  Popconfirm,
  Checkbox,
  Spin,
  Typography,
} from 'antd';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import { payComponentToFormState, emptyPayComponentFormState } from '../../utils/compensationTransformers';
import {
  COMPONENT_TYPE_OPTIONS,
  SUB_TYPE_OPTIONS,
  CALC_METHOD_OPTIONS,
  PAY_FREQUENCY_OPTIONS,
  STATUTORY_LINKAGE_OPTIONS,
} from '../../utils/compensationConstants';
import type { PayComponentFormState } from '../../types/ui.types';
import FormulaEditor from '../molecules/FormulaEditor';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';
import formStyles from '../../styles/PayComponent.module.css';

const PayComponentForm: React.FC = () => {
  const [form] = Form.useForm<PayComponentFormState>();
  const selectedComponent = useHrmCompensationStore((s) => s.selectedComponent);
  const payComponents = useHrmCompensationStore((s) => s.payComponents);
  const componentsLoading = useHrmCompensationStore((s) => s.componentsLoading);
  const savePayComponent = useHrmCompensationStore((s) => s.savePayComponent);
  const deletePayComponent = useHrmCompensationStore((s) => s.deletePayComponent);
  const selectComponent = useHrmCompensationStore((s) => s.selectComponent);

  const [saving, setSaving] = React.useState(false);
  const calcMethod = Form.useWatch('calculationMethod', form);

  // Populate form when selection changes
  useEffect(() => {
    if (selectedComponent) {
      form.setFieldsValue(payComponentToFormState(selectedComponent));
    } else {
      form.setFieldsValue(emptyPayComponentFormState());
    }
  }, [selectedComponent, form]);

  const baseComponentOptions = payComponents
    .filter((c) => c.componentType === 'EARNING' && c.componentCode !== selectedComponent?.componentCode)
    .map((c) => ({ label: `${c.componentCode} — ${c.componentName}`, value: c.componentCode }));

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await savePayComponent(values, selectedComponent?.handle);
    } finally {
      setSaving(false);
    }
  }, [form, savePayComponent, selectedComponent]);

  const handleDelete = useCallback(async () => {
    if (!selectedComponent?.componentCode) return;
    await deletePayComponent(selectedComponent.componentCode);
  }, [selectedComponent, deletePayComponent]);

  const handleCancel = useCallback(() => {
    selectComponent(null);
    form.setFieldsValue(emptyPayComponentFormState());
  }, [selectComponent, form]);

  if (componentsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin tip="Loading..." />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          {selectedComponent ? `Edit: ${selectedComponent.componentCode}` : 'New Pay Component'}
        </span>
      </div>

      <Form form={form} layout="vertical" size="small" className={formStyles.form}>
        <div className={formStyles.formRow}>
          <Form.Item
            name="componentCode"
            label="Component Code"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input
              placeholder="e.g. BASIC"
              disabled={!!selectedComponent}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            name="componentName"
            label="Component Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g. Basic Salary" />
          </Form.Item>
        </div>

        <div className={formStyles.formRow}>
          <Form.Item
            name="componentType"
            label="Type"
            rules={[{ required: true }]}
          >
            <Select options={COMPONENT_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="subType"
            label="Sub-Type"
            rules={[{ required: true }]}
          >
            <Select options={SUB_TYPE_OPTIONS} />
          </Form.Item>
        </div>

        <Divider className={styles.sectionDivider}>Calculation</Divider>

        <Form.Item
          name="calculationMethod"
          label="Calculation Method"
          rules={[{ required: true }]}
        >
          <Select options={CALC_METHOD_OPTIONS} />
        </Form.Item>

        {calcMethod === 'FIXED' && (
          <Form.Item name="fixedAmount" label="Fixed Amount (INR)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        )}

        {calcMethod === 'PERCENTAGE' && (
          <div className={formStyles.formRow}>
            <Form.Item name="percentage" label="Percentage (%)">
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="40" />
            </Form.Item>
            <Form.Item name="baseComponentCode" label="Base Component">
              <Select options={baseComponentOptions} placeholder="Select base" allowClear />
            </Form.Item>
          </div>
        )}

        {calcMethod === 'FORMULA' && (
          <Form.Item name="formula" label="Formula">
            <FormulaEditor value={form.getFieldValue('formula') ?? ''} onChange={(v) => form.setFieldValue('formula', v)} />
          </Form.Item>
        )}

        <div className={formStyles.formRow}>
          <Form.Item name="cap" label="Cap Amount">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="(optional)" />
          </Form.Item>
          <Form.Item name="minimum" label="Minimum Amount">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="(optional)" />
          </Form.Item>
        </div>

        <Divider className={styles.sectionDivider}>Statutory</Divider>

        <Form.Item name="taxable" label="Taxable" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="statutoryLinkage" label="Statutory Linkage">
          <Select options={STATUTORY_LINKAGE_OPTIONS} />
        </Form.Item>

        <div className={formStyles.checkboxRow}>
          <Form.Item name="pfWage" valuePropName="checked" noStyle>
            <Checkbox>PF Wage</Checkbox>
          </Form.Item>
          <Form.Item name="esiWage" valuePropName="checked" noStyle>
            <Checkbox>ESI Wage</Checkbox>
          </Form.Item>
        </div>

        <Divider className={styles.sectionDivider}>Payslip Display</Divider>

        <div className={formStyles.formRow}>
          <Form.Item name="payFrequency" label="Pay Frequency">
            <Select options={PAY_FREQUENCY_OPTIONS} />
          </Form.Item>
          <Form.Item name="displayOrder" label="Display Order">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div className={formStyles.checkboxRow}>
          <Form.Item name="showOnPayslip" valuePropName="checked" noStyle>
            <Checkbox>Show on Payslip</Checkbox>
          </Form.Item>
          <Form.Item name="mandatory" valuePropName="checked" noStyle>
            <Checkbox>Mandatory</Checkbox>
          </Form.Item>
        </div>

        <div className={styles.formActions}>
          <Button onClick={handleCancel}>Cancel</Button>
          {selectedComponent && (
            <Can I="delete">
              <Popconfirm
                title="Deactivate this component?"
                onConfirm={handleDelete}
                okText="Yes"
                okType="danger"
              >
                <Button danger>Deactivate</Button>
              </Popconfirm>
            </Can>
          )}
          <Can I={selectedComponent ? 'edit' : 'add'}>
            <Button type="primary" loading={saving} onClick={handleSave}>
              Save
            </Button>
          </Can>
        </div>
      </Form>
    </div>
  );
};

export default PayComponentForm;
