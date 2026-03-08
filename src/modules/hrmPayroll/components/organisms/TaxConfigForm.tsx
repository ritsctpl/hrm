'use client';

import React, { useEffect, useState } from 'react';
import { Card, Form, InputNumber, Button, Table, Segmented, Select, Space, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import type { TaxSlab } from '../../types/domain.types';
import { getCurrentFinancialYear } from '../../utils/payrollFormatters';
import { validateTaxSlabs } from '../../utils/taxSlabValidator';
import styles from '../../styles/TaxConfig.module.css';

const TaxConfigForm: React.FC = () => {
  const store = useHrmPayrollStore();
  const [form] = Form.useForm();
  const [regime, setRegime] = useState<'OLD' | 'NEW'>('NEW');
  const [financialYear, setFinancialYear] = useState<number>(getCurrentFinancialYear());
  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [slabError, setSlabError] = useState<string | null>(null);

  const currentFY = getCurrentFinancialYear();
  const fyOptions = [currentFY - 1, currentFY, currentFY + 1].map((y) => ({
    value: y,
    label: `${y}-${y + 1}`,
  }));

  useEffect(() => {
    store.fetchTaxConfig(financialYear, regime).then(() => {
      if (store.taxConfig) {
        setSlabs(store.taxConfig.slabs ?? []);
        form.setFieldsValue({
          standardDeduction: store.taxConfig.standardDeduction,
          rebateIncomeLimit: store.taxConfig.rebateIncomeLimit,
          rebateAmount: store.taxConfig.rebateAmount,
          healthAndEducationCess: store.taxConfig.healthAndEducationCess,
          surchargeThreshold1: store.taxConfig.surchargeThreshold1,
          surchargeRate1: store.taxConfig.surchargeRate1,
          surchargeThreshold2: store.taxConfig.surchargeThreshold2,
          surchargeRate2: store.taxConfig.surchargeRate2,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialYear, regime]);

  const handleAddSlab = () => {
    const newSlab: TaxSlab = {
      fromAmount: 0,
      toAmount: null,
      taxRate: 0,
    };
    setSlabs((prev) => [...prev, newSlab]);
  };

  const handleSlabChange = (idx: number, field: keyof TaxSlab, value: number | null) => {
    setSlabs((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const handleDeleteSlab = (idx: number) => {
    setSlabs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const errors = validateTaxSlabs(slabs);
    if (errors.length > 0) {
      setSlabError(errors[0].message);
      return;
    }
    setSlabError(null);
    const vals = await form.validateFields();
    await store.saveTaxConfig({
      handle: store.taxConfig?.handle ?? '',
      site: '',
      financialYearStart: financialYear,
      financialYearEnd: financialYear + 1,
      regime,
      slabs,
      active: 1,
      createdBy: '',
      ...vals,
    });
  };

  const slabColumns: ColumnsType<TaxSlab> = [
    {
      title: 'From (INR)',
      key: 'fromAmount',
      width: 140,
      render: (_: unknown, record: TaxSlab, idx: number) => (
        <InputNumber
          value={record.fromAmount}
          onChange={(v) => handleSlabChange(idx, 'fromAmount', v)}
          min={0}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'To (INR)',
      key: 'toAmount',
      width: 140,
      render: (_: unknown, record: TaxSlab, idx: number) => (
        <InputNumber
          value={record.toAmount ?? undefined}
          onChange={(v) => handleSlabChange(idx, 'toAmount', v)}
          min={0}
          placeholder="(no limit)"
          formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Rate (%)',
      key: 'taxRate',
      width: 100,
      render: (_: unknown, record: TaxSlab, idx: number) => (
        <InputNumber
          value={record.taxRate}
          onChange={(v) => handleSlabChange(idx, 'taxRate', v)}
          min={0}
          max={100}
          step={0.5}
          suffix="%"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, __: TaxSlab, idx: number) => (
        <Popconfirm
          title="Delete this slab?"
          onConfirm={() => handleDeleteSlab(idx)}
          okText="Delete"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlineIcon fontSize="small" />}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className={styles.taxConfigForm}>
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={financialYear}
          onChange={setFinancialYear}
          options={fyOptions}
          style={{ width: 140 }}
        />
        <Segmented
          value={regime}
          onChange={(v) => setRegime(v as 'OLD' | 'NEW')}
          options={[
            { label: 'New Regime', value: 'NEW' },
            { label: 'Old Regime', value: 'OLD' },
          ]}
        />
      </Space>

      <Card
        title="Tax Slabs"
        className={styles.slabCard}
        extra={
          <Button size="small" icon={<AddIcon fontSize="small" />} onClick={handleAddSlab}>
            Add Slab
          </Button>
        }
      >
        {slabError && (
          <div className={styles.slabError}>{slabError}</div>
        )}
        <Table<TaxSlab>
          dataSource={slabs}
          columns={slabColumns}
          rowKey={(_, idx) => String(idx)}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="Other Settings" className={styles.settingsCard} style={{ marginTop: 16 }}>
        <Form form={form} layout="vertical">
          <div className={styles.settingsGrid}>
            <Form.Item label="Standard Deduction (INR)" name="standardDeduction">
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Rebate Limit — 87A (INR)" name="rebateIncomeLimit">
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Rebate Amount (INR)" name="rebateAmount">
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Health & Education Cess (%)" name="healthAndEducationCess">
              <InputNumber min={0} max={10} step={0.5} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Surcharge 1: Income > (INR)" name="surchargeThreshold1">
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Surcharge 1 Rate (%)" name="surchargeRate1">
              <InputNumber min={0} max={50} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Surcharge 2: Income > (INR)" name="surchargeThreshold2">
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Surcharge 2 Rate (%)" name="surchargeRate2">
              <InputNumber min={0} max={50} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSave}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default TaxConfigForm;
