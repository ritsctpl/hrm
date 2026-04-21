'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Input, Select, Button, message } from 'antd';
import { CloseOutlined, UserOutlined } from '@ant-design/icons';
import { MdDelete } from 'react-icons/md';
import { getOrganizationId } from '@/utils/cookieUtils';
import OrgFormField from '../molecules/OrgFormField';
import OrgViewField from '../molecules/OrgViewField';
import OrgSaveButton from '../atoms/OrgSaveButton';
import Can from '../../../hrmAccess/components/Can';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { HrmEmployeeService } from '../../../hrmEmployee/services/hrmEmployeeService';
import type { DepartmentFormProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const DepartmentForm: React.FC<DepartmentFormProps> = ({ onClose, readOnly = false }) => {
  const {
    department,
    businessUnit,
    setDepartmentDraft,
    setDepartmentSelectedBu,
    fetchDepartments,
    saveDepartment,
    deleteDepartment,
  } = useHrmOrganizationStore();

  const { draft, isSaving, isCreating, selected, errors, list, selectedBuHandle } = department;
  const isNew = isCreating && !selected;

  // Keep the parent-department list populated: whenever a BU is active but
  // the list is empty (happens after setDepartmentSelectedBu, which clears
  // the list), fetch departments for that BU so the Parent Department
  // dropdown has options.
  useEffect(() => {
    if (!selectedBuHandle) return;
    if (list.length > 0) return;
    fetchDepartments(selectedBuHandle);
  }, [selectedBuHandle, list.length, fetchDepartments]);

  const handleBuChange = useCallback((val: string) => {
    setDepartmentSelectedBu(val);
    fetchDepartments(val);
  }, [setDepartmentSelectedBu, fetchDepartments]);

  const buOptions = useMemo(() =>
    businessUnit.list.map((bu) => ({
      label: `${bu.buName} (${bu.buCode})`,
      value: bu.handle,
    })),
    [businessUnit.list]
  );
  const title = readOnly 
    ? `View: ${selected?.deptName || ''}` 
    : isNew 
    ? 'New Department' 
    : `Edit: ${selected?.deptName || ''}`;

  // Employee search state
  type EmployeeOption = { value: string; label: React.ReactNode; title: string; keyword: string };
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildEmployeeOption = useCallback((emp: {
    fullName?: string;
    employeeCode?: string;
    handle?: string;
    department?: string;
    role?: string;
  }): EmployeeOption => {
    const code = emp.employeeCode || emp.handle || '';
    const name = emp.fullName || '';
    return {
      value: code,
      title: `${name} (${code})`,
      keyword: `${name} ${code} ${emp.department ?? ''} ${emp.role ?? ''}`.toLowerCase(),
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <UserOutlined style={{ color: '#8c8c8c', flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {code}{emp.department ? ` · ${emp.department}` : ''}{emp.role ? ` · ${emp.role}` : ''}
            </div>
          </div>
        </div>
      ),
    };
  }, []);

  const loadEmployees = useCallback(async (keyword: string = '') => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setEmployeeSearchLoading(true);
    try {
      const result = await HrmEmployeeService.searchByKeyword(organizationId, keyword);
      const employees = result?.employees || [];
      setEmployeeOptions(employees.map(buildEmployeeOption));
      if (!keyword) setEmployeesLoaded(true);
    } catch {
      setEmployeeOptions([]);
    } finally {
      setEmployeeSearchLoading(false);
    }
  }, [buildEmployeeOption]);

  const handleEmployeeSearch = useCallback((keyword: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadEmployees(keyword.trim());
    }, 300);
  }, [loadEmployees]);

  const handleDropdownVisibleChange = useCallback((open: boolean) => {
    if (open && !employeesLoaded && !employeeSearchLoading) {
      loadEmployees('');
    }
  }, [employeesLoaded, employeeSearchLoading, loadEmployees]);

  // Seed the selected employee so edit-mode shows the name, not just the code
  useEffect(() => {
    const selectedId = draft?.headOfDepartmentEmployeeId;
    if (!selectedId) return;
    if (employeeOptions.some((opt) => opt.value === selectedId)) return;
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await HrmEmployeeService.searchByKeyword(organizationId, selectedId);
        if (cancelled) return;
        const employees = result?.employees || [];
        const match = employees.find((e) => (e.employeeCode || e.handle) === selectedId) || employees[0];
        if (match) {
          const opt = buildEmployeeOption(match);
          setEmployeeOptions((prev) =>
            prev.some((p) => p.value === opt.value) ? prev : [opt, ...prev]
          );
        }
      } catch {
        // Swallow — fallback remains the raw code in the select box.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft?.headOfDepartmentEmployeeId, employeeOptions, buildEmployeeOption]);

  // Parent department options (exclude current department).
  // `value` stays as handle for backend compatibility. `label` shows the
  // richer "Name (Code)" combo for the dropdown list / search. The selected
  // box collapses to just the deptCode via `labelRender` below.
  const parentOptions = useMemo(() => {
    return list
      .filter((d) => d.handle !== selected?.handle)
      .map((d) => ({
        value: d.handle,
        label: `${d.deptName} (${d.deptCode})`,
      }));
  }, [list, selected?.handle]);

  // Map handle -> deptCode for the collapsed selector display.
  const handleToDeptCode = useMemo(() => {
    const map = new Map<string, string>();
    list.forEach((d) => map.set(d.handle, d.deptCode));
    return map;
  }, [list]);

  // Get display values for view mode
  const buName = useMemo(() => {
    const bu = businessUnit.list.find(b => b.handle === selectedBuHandle);
    return bu ? `${bu.buName} (${bu.buCode})` : undefined;
  }, [businessUnit.list, selectedBuHandle]);

  const parentDeptName = useMemo(() => {
    const parent = list.find(d => d.handle === draft?.parentDeptHandle);
    return parent ? `${parent.deptName} (${parent.deptCode})` : undefined;
  }, [list, draft?.parentDeptHandle]);

  const handleFieldChange = useCallback(
    (field: string, value: string | number | undefined) => {
      if (readOnly) return;
      setDepartmentDraft({ [field]: value });
    },
    [setDepartmentDraft, readOnly]
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
        {readOnly ? (
          // Read-only view
          <>
            <OrgViewField label="Business Unit" value={buName} required />
            <OrgViewField label="Department Code" value={draft?.deptCode} required />
            <OrgViewField label="Department Name" value={draft?.deptName} required />
            <div className={formStyles.addressFieldFull}>
              <OrgViewField label="Parent Department" value={parentDeptName} />
            </div>
            <div className={formStyles.addressFieldFull}>
              <OrgViewField label="Head of Department" value={draft?.headOfDepartmentEmployeeId} />
            </div>
          </>
        ) : (
          // Editable form
          <>
            {isNew && (
              <div className={formStyles.addressFieldFull}>
                <OrgFormField label="Business Unit" required error={!selectedBuHandle ? 'Business Unit is required' : undefined}>
                  <Select
                    value={selectedBuHandle || undefined}
                    onChange={handleBuChange}
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
                  labelRender={(labelProps) => {
                    const handle = labelProps.value as string | undefined;
                    if (!handle) return null;
                    const code = handleToDeptCode.get(handle);
                    return <>{code ?? labelProps.label ?? handle}</>;
                  }}
                  style={{ width: '100%' }}
                />
              </OrgFormField>
            </div>

            <div className={formStyles.addressFieldFull}>
              <OrgFormField label="Head of Department" error={errors.headOfDepartmentEmployeeId}>
                <Select
                  showSearch
                  value={draft?.headOfDepartmentEmployeeId || undefined}
                  placeholder="Browse or type to search employee..."
                  filterOption={(input, option) => {
                    const opt = option as unknown as EmployeeOption | undefined;
                    if (!input) return true;
                    return !!opt?.keyword?.includes(input.toLowerCase());
                  }}
                  onSearch={handleEmployeeSearch}
                  onDropdownVisibleChange={handleDropdownVisibleChange}
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
                      : 'No employees found'
                  }
                  suffixIcon={<UserOutlined style={{ color: '#bfbfbf' }} />}
                />
              </OrgFormField>
            </div>
          </>
        )}
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
