'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Popconfirm,
  Typography,
  Divider,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useHrmGradeStore } from '../../stores/gradeStore';
import type { GradeFormState } from '../../types/ui.types';
import {
  TRACK_OPTIONS,
  APPRAISAL_CYCLE_OPTIONS,
  CURRENCY_OPTIONS,
} from '../../utils/gradeConstants';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Grade.module.css';

const DATE_FMT = 'YYYY-MM-DD';

const GradeForm: React.FC = () => {
  const [form] = Form.useForm();
  const grades = useHrmGradeStore((s) => s.grades);
  const selectedGrade = useHrmGradeStore((s) => s.selectedGrade);
  const selectGrade = useHrmGradeStore((s) => s.selectGrade);
  const saveGrade = useHrmGradeStore((s) => s.saveGrade);
  const deactivateGrade = useHrmGradeStore((s) => s.deactivateGrade);

  const [saving, setSaving] = useState(false);
  const isEdit = !!selectedGrade;

  // Other grades become promotion-target options (a grade can't promote to itself).
  const nextGradeOptions = useMemo(
    () =>
      grades
        .filter((g) => g.gradeCode !== selectedGrade?.gradeCode)
        .map((g) => ({ label: `${g.gradeName} (${g.gradeCode})`, value: g.gradeCode })),
    [grades, selectedGrade],
  );

  useEffect(() => {
    if (selectedGrade) {
      form.setFieldsValue({
        gradeCode: selectedGrade.gradeCode,
        gradeName: selectedGrade.gradeName,
        level: selectedGrade.level,
        track: selectedGrade.track,
        description: selectedGrade.description,
        minSalary: selectedGrade.salaryBand?.minSalary,
        midSalary: selectedGrade.salaryBand?.midSalary,
        maxSalary: selectedGrade.salaryBand?.maxSalary,
        currency: selectedGrade.salaryBand?.currency ?? 'INR',
        cycle: selectedGrade.appraisalConfig?.cycle ?? 'ANNUAL',
        eligibilityMonths: selectedGrade.appraisalConfig?.eligibilityMonths,
        ratingScale: selectedGrade.appraisalConfig?.ratingScale,
        nextGradeCodes: selectedGrade.progression?.nextGradeCodes ?? [],
        minTenureMonths: selectedGrade.progression?.minTenureMonths,
        effectiveFrom: selectedGrade.effectiveFrom
          ? dayjs(selectedGrade.effectiveFrom)
          : dayjs(),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ currency: 'INR', cycle: 'ANNUAL', effectiveFrom: dayjs() });
    }
  }, [selectedGrade, form]);

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    // Band sanity: min <= mid <= max.
    if (
      values.minSalary != null &&
      values.maxSalary != null &&
      values.minSalary > values.maxSalary
    ) {
      message.error('Min salary cannot exceed max salary');
      return;
    }
    const data: GradeFormState = {
      ...values,
      effectiveFrom: values.effectiveFrom
        ? dayjs(values.effectiveFrom).format(DATE_FMT)
        : dayjs().format(DATE_FMT),
    };
    setSaving(true);
    try {
      await saveGrade(data, selectedGrade?.handle);
    } catch (e) {
      message.error((e as Error)?.message ?? 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          {isEdit ? `Edit Grade — ${selectedGrade?.gradeName}` : 'New Grade'}
        </span>
      </div>

      <Form form={form} layout="vertical" requiredMark="optional">
        <div className={styles.formGrid}>
          <Form.Item
            name="gradeCode"
            label="Grade Code"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g. G3, M1" disabled={isEdit} />
          </Form.Item>
          <Form.Item
            name="gradeName"
            label="Grade Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g. Senior Engineer" />
          </Form.Item>
          <Form.Item
            name="level"
            label="Level (rank)"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} placeholder="1 = junior" />
          </Form.Item>
          <Form.Item
            name="track"
            label="Career Track"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={TRACK_OPTIONS} placeholder="Select track" />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="What this grade represents" />
        </Form.Item>

        <Divider className={styles.sectionDivider} orientation="left" plain>
          Salary Band
        </Divider>
        <div className={styles.formGrid}>
          <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>
          <Form.Item name="minSalary" label="Min (annual)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} step={1000} />
          </Form.Item>
          <Form.Item name="midSalary" label="Mid (annual)">
            <InputNumber min={0} style={{ width: '100%' }} step={1000} />
          </Form.Item>
          <Form.Item name="maxSalary" label="Max (annual)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} step={1000} />
          </Form.Item>
        </div>

        <Divider className={styles.sectionDivider} orientation="left" plain>
          Appraisal Configuration
        </Divider>
        <div className={styles.formGrid}>
          <Form.Item name="cycle" label="Appraisal Cycle" rules={[{ required: true }]}>
            <Select options={APPRAISAL_CYCLE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="eligibilityMonths"
            label="Eligibility (months in grade)"
            tooltip="Min months at this grade before appraisal eligibility"
          >
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ratingScale" label="Rating Scale">
            <Input placeholder="e.g. 1-5, A-E" />
          </Form.Item>
        </div>

        <Divider className={styles.sectionDivider} orientation="left" plain>
          Progression &amp; Opportunities
        </Divider>
        <div className={styles.formGrid}>
          <Form.Item
            name="nextGradeCodes"
            label="Promotes To"
            tooltip="Grades an employee at this grade can be promoted into"
            style={{ gridColumn: '1 / 3' }}
          >
            <Select
              mode="multiple"
              allowClear
              options={nextGradeOptions}
              placeholder="Select next grade(s)"
            />
          </Form.Item>
          <Form.Item
            name="minTenureMonths"
            label="Min Tenure for Promotion (months)"
          >
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format={DATE_FMT} />
          </Form.Item>
        </div>

        <div className={styles.formActions}>
          {isEdit && (
            <Can I="delete" object="grade_master">
              <Popconfirm
                title="Deactivate this grade?"
                description="Employees keep their grade history; the grade is hidden from new assignments."
                onConfirm={() => deactivateGrade(selectedGrade!.gradeCode)}
                okText="Deactivate"
                okButtonProps={{ danger: true }}
              >
                <Button danger style={{ marginRight: 'auto' }}>
                  Deactivate
                </Button>
              </Popconfirm>
            </Can>
          )}
          <Button onClick={() => selectGrade(null)}>Cancel</Button>
          <Can I={isEdit ? 'edit' : 'add'} object="grade_master">
            <Button type="primary" loading={saving} onClick={handleSave}>
              {isEdit ? 'Update Grade' : 'Create Grade'}
            </Button>
          </Can>
        </div>
      </Form>

      {!isEdit && grades.length === 0 && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
          Tip: define grades from junior (low level) to senior (high level). Salary, appraisal,
          and promotion rules all read from the grade you create here.
        </Typography.Paragraph>
      )}
    </div>
  );
};

export default GradeForm;
