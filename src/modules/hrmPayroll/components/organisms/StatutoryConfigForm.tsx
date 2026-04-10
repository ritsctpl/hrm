'use client';

import React, { useEffect } from 'react';
import { Card, Form, InputNumber, Switch, Button } from 'antd';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/TaxConfig.module.css';

const StatutoryConfigForm: React.FC = () => {
  const store = useHrmPayrollStore();
  const [pfForm] = Form.useForm();
  const [esiForm] = Form.useForm();

  useEffect(() => {
    store.fetchStatutoryConfig('PF');
    store.fetchStatutoryConfig('ESI');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (store.pfConfig) {
      pfForm.setFieldsValue({
        pfEmployeeRate: store.pfConfig.pfEmployeeRate,
        pfEmployerRate: store.pfConfig.pfEmployerRate,
        pfWageCeiling: store.pfConfig.pfWageCeiling,
        pfOnActualWage: store.pfConfig.pfOnActualWage,
      });
    }
  }, [store.pfConfig, pfForm]);

  useEffect(() => {
    if (store.esiConfig) {
      esiForm.setFieldsValue({
        esiEmployeeRate: store.esiConfig.esiEmployeeRate,
        esiEmployerRate: store.esiConfig.esiEmployerRate,
        esiWageCeiling: store.esiConfig.esiWageCeiling,
      });
    }
  }, [store.esiConfig, esiForm]);

  const handleSavePF = async () => {
    const vals = await pfForm.validateFields();
    await store.saveStatutoryConfig({
      handle: store.pfConfig?.handle ?? '',
      site: '',
      configType: 'PF',
      active: 1,
      createdBy: '',
      ...vals,
    });
  };

  const handleSaveESI = async () => {
    const vals = await esiForm.validateFields();
    await store.saveStatutoryConfig({
      handle: store.esiConfig?.handle ?? '',
      site: '',
      configType: 'ESI',
      active: 1,
      createdBy: '',
      ...vals,
    });
  };

  return (
    <div className={styles.statutoryForm}>
      {/* Provident Fund */}
      <Card title="Provident Fund (PF)" className={styles.statutoryCard}>
        <Form form={pfForm} layout="vertical">
          <div className={styles.statutoryGrid}>
            <Form.Item label="Employee Rate (%)" name="pfEmployeeRate">
              <InputNumber min={0} max={20} step={0.5} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Employer Rate (%)" name="pfEmployerRate">
              <InputNumber min={0} max={20} step={0.5} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Wage Ceiling (INR)" name="pfWageCeiling">
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Apply on Actual Wage (if > ceiling)" name="pfOnActualWage" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
        <Can I="edit">
          <Button type="primary" onClick={handleSavePF} style={{ marginTop: 8 }}>
            Save PF Settings
          </Button>
        </Can>
      </Card>

      {/* ESI */}
      <Card title="Employees&apos; State Insurance (ESI)" className={styles.statutoryCard} style={{ marginTop: 16 }}>
        <Form form={esiForm} layout="vertical">
          <div className={styles.statutoryGrid}>
            <Form.Item label="Employee Rate (%)" name="esiEmployeeRate">
              <InputNumber min={0} max={5} step={0.25} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Employer Rate (%)" name="esiEmployerRate">
              <InputNumber min={0} max={10} step={0.25} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Wage Ceiling (INR)" name="esiWageCeiling">
              <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
        <Can I="edit">
          <Button type="primary" onClick={handleSaveESI} style={{ marginTop: 8 }}>
            Save ESI Settings
          </Button>
        </Can>
      </Card>
    </div>
  );
};

export default StatutoryConfigForm;
