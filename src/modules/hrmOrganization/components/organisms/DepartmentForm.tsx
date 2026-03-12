'use client';

import React, { useCallback, useMemo } from 'react';
import { Input, Select, Button, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { MdDelete } from 'react-icons/md';
import OrgFormField from '../molecules/OrgFormField';
import OrgSaveButton from '../atoms/OrgSaveButton';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { DepartmentFormProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const DepartmentForm: React.FC<DepartmentFormProps> = ({ onClose }) => {
  const {
    department,
    setDepartmentDraft,
    saveDepartment,
    deleteDepartment,
  } = useHrmOrganizationStore();

  const { draft, isSaving, isCreating, selected, errors, list } = department;
  const isNew = isCreating && !selected;
  const title = isNew ? 'New Department' : `Edit: ${selected?.deptName || ''}`;

  // Parent department options (exclude current department)
  const parentOptions = useMemo(() => {
    return list
      .filter((d) => d.handle !== selected?.handle)
      .map((d) => ({
        label: `${d.deptName} (${d.deptCode})`,
        value: d.handle,
      }));
  }, [list, selected?.handle]);

  const handleFieldChange = useCallback(
    (field: string, value: string | number | undefined) => {
      setDepartmentDraft({ [field]: value });
    },
    [setDepartmentDraft]
  );

  const handleSave = useCallback(async () => {
    try {
      await saveDepartment();
      message.success(isNew ? 'Department created' : 'Department updated');
    } catch {
      message.error('Failed to save department');
    }
  }, [saveDepartment, isNew]);

  const handleDelete = useCallback(async () => {
    if (!selected?.handle) return;
    try {
      await deleteDepartment(selected.handle);
      message.success('Department deleted');
      onClose();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete department';
      message.error(errorMsg);
    }
  }, [selected?.handle, deleteDepartment, onClose]);

  return (
    <div className={mainStyles.formPanel}>
      <div className={mainStyles.formPanelHeader}>
        <span className={mainStyles.formPanelTitle}>{title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isNew && selected && (
            <Button
              type="text"
              danger
              icon={<MdDelete />}
              onClick={handleDelete}
            />
          )}
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </div>
      </div>

      <div className={formStyles.deptFormGrid}>
        <OrgFormField label="Department Code" required error={errors.deptCode}>
          <Input
            value={draft?.deptCode || ''}
            onChange={(e) => handleFieldChange('deptCode', e.target.value)}
            placeholder="Enter department code"
            disabled={!isNew}
          />
        </OrgFormField>

        <OrgFormField label="Department Name" required error={errors.deptName}>
          <Input
            value={draft?.deptName || ''}
            onChange={(e) => handleFieldChange('deptName', e.target.value)}
            placeholder="Enter department name"
          />
        </OrgFormField>

        <div className={formStyles.addressFieldFull}>
          <OrgFormField label="Parent Department" error={errors.parentDeptHandle}>
            <Select
              value={draft?.parentDeptHandle || undefined}
              onChange={(val) => handleFieldChange('parentDeptHandle', val)}
              options={parentOptions}
              placeholder="Select parent department (optional)"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
            />
          </OrgFormField>
        </div>

        <OrgFormField label="Head Employee" error={errors.headOfDepartmentEmployeeId}>
          <Input
            value={draft?.headOfDepartmentEmployeeId || ''}
            onChange={(e) => handleFieldChange('headOfDepartmentEmployeeId', e.target.value)}
            placeholder="Enter employee ID or name"
          />
        </OrgFormField>
      </div>

      {errors._general && (
        <div style={{ color: '#ff4d4f', marginTop: 8 }}>{errors._general}</div>
      )}

      <div className={mainStyles.formActions}>
        <div style={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <OrgSaveButton
          loading={isSaving}
          onClick={handleSave}
          label={isNew ? 'Create' : 'Update'}
        />
      </div>
    </div>
  );
};

export default DepartmentForm;
