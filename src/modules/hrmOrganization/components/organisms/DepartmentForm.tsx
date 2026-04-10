'use client';

import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Input, Select, Button, message } from 'antd';
import { CloseOutlined, UserOutlined } from '@ant-design/icons';
import { MdDelete } from 'react-icons/md';
import { parseCookies } from 'nookies';
import OrgFormField from '../molecules/OrgFormField';
import OrgSaveButton from '../atoms/OrgSaveButton';
import Can from '../../../hrmAccess/components/Can';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { HrmEmployeeService } from '../../../hrmEmployee/services/hrmEmployeeService';
import type { DepartmentFormProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const DepartmentForm: React.FC<DepartmentFormProps> = ({ onClose }) => {
  const {
    department,
    businessUnit,
    setDepartmentDraft,
    setDepartmentSelectedBu,
    saveDepartment,
    deleteDepartment,
  } = useHrmOrganizationStore();

  const { draft, isSaving, isCreating, selected, errors, list, selectedBuHandle } = department;
  const isNew = isCreating && !selected;

  const buOptions = useMemo(() =>
    businessUnit.list.map((bu) => ({
      label: `${bu.buName} (${bu.buCode})`,
      value: bu.handle,
    })),
    [businessUnit.list]
  );
  const title = isNew ? 'New Department' : `Edit: ${selected?.deptName || ''}`;

  // Employee search state
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmployeeSearch = useCallback((keyword: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!keyword || keyword.length < 2) {
      setEmployeeOptions([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      const cookies = parseCookies();
      const site = cookies.site || '';
      if (!site) return;

      setEmployeeSearchLoading(true);
      try {
        const result = await HrmEmployeeService.searchByKeyword(site, keyword);
        const employees = result?.employees || [];
        setEmployeeOptions(
          employees.map((emp) => ({
            value: emp.employeeCode || emp.handle,
            // Simple string label for the selected display (prevents overflow)
            title: `${emp.fullName} (${emp.employeeCode})`,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <UserOutlined style={{ color: '#8c8c8c', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.fullName}</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {emp.employeeCode}{emp.department ? ` · ${emp.department}` : ''}{emp.role ? ` · ${emp.role}` : ''}
                  </div>
                </div>
              </div>
            ),
          }))
        );
      } catch {
        setEmployeeOptions([]);
      } finally {
        setEmployeeSearchLoading(false);
      }
    }, 400);
  }, []);

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
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save department';
      message.error(errorMsg);
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
            <Can I="delete">
              <Button
                type="text"
                danger
                icon={<MdDelete />}
                onClick={handleDelete}
              />
            </Can>
          )}
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </div>
      </div>

      <div className={formStyles.deptFormGrid}>
        {isNew && (
          <div className={formStyles.addressFieldFull}>
            <OrgFormField label="Business Unit" required error={!selectedBuHandle ? 'Business Unit is required' : undefined}>
              <Select
                value={selectedBuHandle || undefined}
                onChange={(val) => setDepartmentSelectedBu(val)}
                options={buOptions}
                placeholder="Select Business Unit"
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
              />
            </OrgFormField>
          </div>
        )}

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

        <div className={formStyles.addressFieldFull}>
          <OrgFormField label="Head of Department" error={errors.headOfDepartmentEmployeeId}>
            <Select
              showSearch
              value={draft?.headOfDepartmentEmployeeId || undefined}
              placeholder="Type to search employee..."
              filterOption={false}
              onSearch={handleEmployeeSearch}
              onChange={(val) => handleFieldChange('headOfDepartmentEmployeeId', val)}
              options={employeeOptions}
              loading={employeeSearchLoading}
              allowClear
              style={{ width: '100%' }}
              optionLabelProp="title"
              popupMatchSelectWidth={350}
              notFoundContent={
                employeeSearchLoading
                  ? 'Searching...'
                  : employeeOptions.length === 0
                  ? 'Type at least 2 characters to search'
                  : 'No employees found'
              }
              suffixIcon={<UserOutlined style={{ color: '#bfbfbf' }} />}
            />
          </OrgFormField>
        </div>
      </div>

      {errors._general && (
        <div style={{ color: '#ff4d4f', marginTop: 8 }}>{errors._general}</div>
      )}

      <div className={mainStyles.formActions}>
        <div style={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <Can I={isNew ? 'add' : 'edit'}>
          <OrgSaveButton
            loading={isSaving}
            onClick={handleSave}
            label={isNew ? 'Create' : 'Update'}
          />
        </Can>
      </div>
    </div>
  );
};

export default DepartmentForm;
