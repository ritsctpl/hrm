'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, InputNumber, Button, Select, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import type { ProfessionalTaxSlab } from '../../types/domain.types';
import { validatePtSlabs } from '../../utils/taxSlabValidator';
import { INDIAN_STATES } from '../../utils/payrollConstants';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/TaxConfig.module.css';

const PtSlabEditor: React.FC = () => {
  const store = useHrmPayrollStore();
  const [state, setState] = useState<string>('KA');
  const [slabs, setSlabs] = useState<ProfessionalTaxSlab[]>([]);
  const [slabError, setSlabError] = useState<string | null>(null);

  useEffect(() => {
    store.fetchStatutoryConfig('PT');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (store.ptConfig?.ptSlabs) {
      setSlabs(store.ptConfig.ptSlabs);
      if (store.ptConfig.state) setState(store.ptConfig.state);
    }
  }, [store.ptConfig]);

  const handleSlabChange = (idx: number, field: keyof ProfessionalTaxSlab, value: number | null) => {
    setSlabs((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const handleAddSlab = () => {
    setSlabs((prev) => [
      ...prev,
      { fromSalary: 0, toSalary: null, monthlyPT: 0 },
    ]);
  };

  const handleDeleteSlab = (idx: number) => {
    setSlabs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const errors = validatePtSlabs(slabs);
    if (errors.length > 0) {
      setSlabError(errors[0].message);
      return;
    }
    setSlabError(null);
    await store.saveStatutoryConfig({
      handle: store.ptConfig?.handle ?? '',
      site: '',
      configType: 'PT',
      state,
      ptSlabs: slabs,
      active: 1,
      createdBy: '',
    });
  };

  const slabColumns: ColumnsType<ProfessionalTaxSlab> = [
    {
      title: 'From Salary (INR)',
      key: 'fromSalary',
      width: 160,
      render: (_: unknown, record: ProfessionalTaxSlab, idx: number) => (
        <InputNumber
          value={record.fromSalary}
          onChange={(v) => handleSlabChange(idx, 'fromSalary', v)}
          min={0}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'To Salary (INR)',
      key: 'toSalary',
      width: 160,
      render: (_: unknown, record: ProfessionalTaxSlab, idx: number) => (
        <InputNumber
          value={record.toSalary ?? undefined}
          onChange={(v) => handleSlabChange(idx, 'toSalary', v)}
          min={0}
          placeholder="(no limit)"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Monthly PT (INR)',
      key: 'monthlyPT',
      width: 150,
      render: (_: unknown, record: ProfessionalTaxSlab, idx: number) => (
        <InputNumber
          value={record.monthlyPT}
          onChange={(v) => handleSlabChange(idx, 'monthlyPT', v)}
          min={0}
          prefix="₹"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      render: (_: unknown, __: ProfessionalTaxSlab, idx: number) => (
        <Can I="delete">
          <Popconfirm
            title="Delete this slab?"
            onConfirm={() => handleDeleteSlab(idx)}
            okText="Delete"
          >
            <Button type="text" danger icon={<DeleteOutlineIcon fontSize="small" />} />
          </Popconfirm>
        </Can>
      ),
    },
  ];

  return (
    <div className={styles.ptEditor}>
      <div style={{ marginBottom: 16 }}>
        <Select
          value={state}
          onChange={setState}
          options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
          style={{ width: 240 }}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <Card
        title="Professional Tax Slabs"
        className={styles.slabCard}
        extra={
          <Can I="add">
            <Button size="small" icon={<AddIcon fontSize="small" />} onClick={handleAddSlab}>
              Add Slab
            </Button>
          </Can>
        }
      >
        {slabError && (
          <div className={styles.slabError}>{slabError}</div>
        )}
        <Table<ProfessionalTaxSlab>
          dataSource={slabs}
          columns={slabColumns}
          rowKey={(_, idx) => String(idx)}
          pagination={false}
          size="small"
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Can I="edit">
          <Button type="primary" onClick={handleSave}>
            Save Professional Tax
          </Button>
        </Can>
      </div>
    </div>
  );
};

export default PtSlabEditor;
