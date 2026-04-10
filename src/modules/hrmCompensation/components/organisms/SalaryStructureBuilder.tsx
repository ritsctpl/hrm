'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Form, Input, Select, Button, Tag, Typography } from 'antd';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import { getAvailableComponents } from '../../utils/compensationTransformers';
import { GRADE_OPTIONS } from '../../utils/compensationConstants';
import type { SalaryStructure, SalaryStructureComponent } from '../../types/domain.types';
import StructureComponentsTable from './StructureComponentsTable';
import CompensationPreview from './CompensationPreview';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';
import structureStyles from '../../styles/SalaryStructure.module.css';

interface BuilderFormState {
  structureCode: string;
  structureName: string;
  applicableGrade: string;
  description: string;
}

const SalaryStructureBuilder: React.FC = () => {
  const [form] = Form.useForm<BuilderFormState>();
  const selectedStructure = useHrmCompensationStore((s) => s.selectedStructure);
  const payComponents = useHrmCompensationStore((s) => s.payComponents);
  const saveSalaryStructure = useHrmCompensationStore((s) => s.saveSalaryStructure);
  const selectStructure = useHrmCompensationStore((s) => s.selectStructure);
  const previewCompensation = useHrmCompensationStore((s) => s.previewCompensation);
  const runPreview = useHrmCompensationStore((s) => s.runPreview);

  const [components, setComponents] = useState<SalaryStructureComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const available = getAvailableComponents(payComponents, { ...selectedStructure, components } as SalaryStructure);

  // Sync form when structure changes
  useEffect(() => {
    if (selectedStructure) {
      form.setFieldsValue({
        structureCode: selectedStructure.structureCode,
        structureName: selectedStructure.structureName,
        applicableGrade: selectedStructure.applicableGrade,
        description: selectedStructure.description,
      });
      setComponents(selectedStructure.components);
    } else {
      form.resetFields();
      setComponents([]);
    }
  }, [selectedStructure, form]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const code = e.dataTransfer.getData('componentCode');
      if (!code) return;
      const comp = payComponents.find((c) => c.componentCode === code);
      if (!comp) return;
      if (components.some((c) => c.componentCode === code)) return;
      const newRow: SalaryStructureComponent = {
        componentCode: comp.componentCode,
        calculationMethod: comp.calculationMethod,
        defaultAmount: comp.fixedAmount,
        defaultPercentage: comp.percentage,
        formula: comp.formula,
        displayOrder: components.length + 1,
      };
      setComponents((prev) => [...prev, newRow]);
    },
    [components, payComponents],
  );

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        handle: selectedStructure?.handle ?? '',
        site: '',
        ...values,
        components,
        active: 1,
        createdDateTime: '',
        modifiedDateTime: '',
      } as SalaryStructure;
      await saveSalaryStructure(payload);
    } finally {
      setSaving(false);
    }
  }, [form, components, selectedStructure, saveSalaryStructure]);

  const handlePreview = useCallback(async () => {
    await runPreview({
      site: '',
      employeeId: 'PREVIEW',
      effectiveFrom: new Date().toISOString().split('T')[0],
      structureCode: form.getFieldValue('structureCode'),
      components: components.map((c) => ({
        componentCode: c.componentCode,
        calculationMethod: c.calculationMethod,
        amount: c.defaultAmount,
        percentage: c.defaultPercentage,
        formula: c.formula,
      })),
      remarks: 'preview',
      createdBy: 'system',
    });
  }, [form, components, runPreview]);

  const handleCancel = useCallback(() => {
    selectStructure(null);
    form.resetFields();
    setComponents([]);
  }, [selectStructure, form]);

  return (
    <div className={structureStyles.builderContainer}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          {selectedStructure ? `Edit: ${selectedStructure.structureCode}` : 'New Salary Structure'}
        </span>
      </div>

      <Form form={form} layout="vertical" size="small">
        <div className={structureStyles.builderHeader}>
          <Form.Item
            name="structureCode"
            label="Structure Code"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. STR_EXEC_001" disabled={!!selectedStructure} />
          </Form.Item>
          <Form.Item
            name="applicableGrade"
            label="Applicable Grade"
            rules={[{ required: true }]}
          >
            <Select options={GRADE_OPTIONS} placeholder="Select grade" />
          </Form.Item>
          <Form.Item
            name="structureName"
            label="Structure Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. Executive Grade Structure" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Brief description" />
          </Form.Item>
        </div>
      </Form>

      <div>
        <div className={structureStyles.availablePoolTitle}>
          Available Components — drag to add:
        </div>
        <div className={structureStyles.availablePool}>
          {available.length === 0 ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              All components added
            </Typography.Text>
          ) : (
            available.map((c) => (
              <Tag
                key={c.componentCode}
                color="blue"
                className={structureStyles.draggableTag}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('componentCode', c.componentCode)}
              >
                {c.componentCode}
              </Tag>
            ))
          )}
        </div>
      </div>

      <div>
        <div className={structureStyles.sectionTitle}>Structure Components:</div>
        <div
          className={`${structureStyles.dropZone} ${dragOver ? structureStyles.dragOver : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={components.length > 0 ? { display: 'none' } : {}}
        >
          Drop components here to build structure
        </div>
        {components.length > 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <StructureComponentsTable components={components} onChange={setComponents} />
          </div>
        )}
      </div>

      {previewCompensation && (
        <CompensationPreview data={previewCompensation} />
      )}

      <div className={styles.formActions}>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handlePreview} disabled={components.length === 0}>
          Preview
        </Button>
        <Can I={selectedStructure ? 'edit' : 'add'}>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Save Structure
          </Button>
        </Can>
      </div>
    </div>
  );
};

export default SalaryStructureBuilder;
