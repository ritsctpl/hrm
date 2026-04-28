'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Input, Select, Button, message, Popconfirm } from 'antd';
import { CloseOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
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

const DepartmentForm: React.FC<DepartmentFormProps> = ({ onClose, readOnly = false, onEnterEditMode }) => {
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
    // Reload the full list on every open. Previous implementation only
    // loaded once (`!employeesLoaded` guard) — but typing a search REPLACES
    // `employeeOptions` with the filtered result, and selecting from that
    // narrow list then closing the dropdown leaves the next open showing
    // only the stale filtered rows until the user re-types.
    if (open && !employeeSearchLoading) {
      loadEmployees('');
    }
  }, [employeeSearchLoading, loadEmployees]);

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

  // Parent department options. Guard against stale / soft-deleted rows the
  // backend may still return. The `active` field has been seen as a number,
  // string, or boolean depending on backend version — treat any of the known
  // inactive markers as exclusion. Also exclude the current department to
  // prevent self-parenting.
  const parentOptions = useMemo(() => {
    const isInactive = (d: { active?: unknown; status?: unknown }) => {
      const a = d.active;
      const s = (d.status as string | undefined)?.toUpperCase();
      if (a === 0 || a === '0' || a === false || a === 'N') return true;
      if (s === 'INACTIVE' || s === 'DELETED' || s === 'DISABLED') return true;
      return false;
    };
    const opts = list
      .filter((d) => d.handle !== selected?.handle)
      .filter((d) => !isInactive(d as { active?: unknown; status?: unknown }))
      .filter((d) => !!d.deptName?.trim() && !!d.deptCode?.trim())
      // Restrict to the currently-selected BU. Some backends include
      // departments from other BUs in the list response when org-wide
      // scoping is loose, which would let users pick an invalid parent
      // outside the BU. Guard explicitly against that.
      .filter((d) => !selectedBuHandle || (d as { buHandle?: string }).buHandle === selectedBuHandle)
      .map((d) => ({
        value: d.handle,
        label: `${d.deptName} (${d.deptCode})`,
      }));
    // If the current parent isn't in the filtered options (e.g. it's from
    // another BU, or the list hasn't loaded yet), inject it so the Select
    // can render a readable label instead of the raw handle.
    const currentParent = draft?.parentDeptHandle;
    if (currentParent && !opts.some((o) => o.value === currentParent)) {
      const name = (draft as { parentDeptName?: string })?.parentDeptName;
      opts.unshift({
        value: currentParent,
        label: name || currentParent,
      });
    }
    return opts;
  }, [list, selected?.handle, draft?.parentDeptHandle, draft, selectedBuHandle]);

  // Map handle -> readable label for the collapsed selector. Prefer the
  // departments list; fall back to the loaded draft's parentDeptName so a
  // saved parent from a different BU still shows a name.
  const handleToLabel = useMemo(() => {
    const map = new Map<string, string>();
    list.forEach((d) => {
      if (d.deptName && d.deptCode) {
        map.set(d.handle, `${d.deptName} (${d.deptCode})`);
      }
    });
    const draftParent = (draft as { parentDeptHandle?: string; parentDeptName?: string });
    if (draftParent?.parentDeptHandle && draftParent?.parentDeptName && !map.has(draftParent.parentDeptHandle)) {
      map.set(draftParent.parentDeptHandle, draftParent.parentDeptName);
    }
    return map;
  }, [list, draft]);

  // Get display values for view mode
  const buName = useMemo(() => {
    const bu = businessUnit.list.find(b => b.handle === selectedBuHandle);
    return bu ? `${bu.buName} (${bu.buCode})` : undefined;
  }, [businessUnit.list, selectedBuHandle]);

  // Prefer a readable "Name (CODE)" label. Falls back to the backend-supplied
  // parentDeptName when the full dept entry isn't available in `list` (e.g.
  // parent belongs to a BU that hasn't been fetched yet). Never shows the
  // raw handle.
  const parentDeptName = useMemo(() => {
    const handle = draft?.parentDeptHandle;
    if (!handle) return undefined;
    const parent = list.find(d => d.handle === handle);
    if (parent) return `${parent.deptName} (${parent.deptCode})`;
    const draftParentName = (draft as { parentDeptName?: string })?.parentDeptName;
    if (draftParentName) return draftParentName;
    return undefined;
  }, [list, draft?.parentDeptHandle, draft]);

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
          {onEnterEditMode && (
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={onEnterEditMode}
            >
              Edit
            </Button>
          )}
          {!isNew && selected && (
            // Delete is always available to users with Delete permission —
            // no need to enter edit mode first. The Popconfirm guards
            // against accidental taps since the button now sits next to
            // the passive View controls.
            <Can I="delete">
              <Popconfirm
                title="Delete department"
                description={`Delete "${selected.deptName}"? This cannot be undone.`}
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
              >
                <Button
                  type="text"
                  danger
                  icon={<MdDelete />}
                />
              </Popconfirm>
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
                    // Prefer "Name (CODE)" so users see what they picked
                    // rather than an opaque UUID. Falls back through the
                    // handle-to-label map (covers parents outside current
                    // BU list) and finally to the raw label/handle.
                    const readable = handleToLabel.get(handle);
                    if (readable) return <>{readable}</>;
                    if (labelProps.label) return <>{labelProps.label}</>;
                    return <>{handle}</>;
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
        <Button onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && (
          <Can I={isNew ? 'add' : 'edit'}>
            <OrgSaveButton
              loading={isSaving}
              onClick={handleSave}
              label={isNew ? 'Create' : 'Update'}
            />
          </Can>
        )}
      </div>
    </div>
  );
};

export default DepartmentForm;
