/**
 * OfficialDetailsTab - View/edit official employment details
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Button, Input, Form, Select, DatePicker, message } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import { formatDate } from '../../utils/transformations';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import { DESIGNATION_OPTIONS } from '../../utils/constants';
import { useEmployeeLookups } from '../../hooks/useEmployeeLookups';
import type { ProfileTabProps } from '../../types/ui.types';
import type { EmploymentStatus } from '../../types/domain.types';

const EMPLOYMENT_STATUS_OPTIONS: { label: string; value: EmploymentStatus }[] = [
  { label: 'Probation', value: 'PROBATION' },
  { label: 'Permanent', value: 'PERMANENT' },
  { label: 'Notice Period', value: 'NOTICE_PERIOD' },
  { label: 'Terminated', value: 'TERMINATED' },
];

const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> =
  EMPLOYMENT_STATUS_OPTIONS.reduce(
    (acc, opt) => ({ ...acc, [opt.value]: opt.label }),
    {} as Record<EmploymentStatus, string>,
  );
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

export interface OfficialDetailsTabHandle {
  save: () => Promise<void>;
  cancel: () => void;
}

const OfficialDetailsTab = forwardRef<OfficialDetailsTabHandle, ProfileTabProps>(({
  profile,
  isEditing,
  isSaving,
  onSave,
  onEdit,
  editingSection,
}, ref) => {
  const { officialDetails } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);
  // Admin-configurable dropdowns (Employee Settings). Fall back to the built-in
  // designation list only when the admin has not configured any yet.
  const { values: gradeOptions } = useEmployeeLookups('GRADE');
  const { values: designationOptions } = useEmployeeLookups('DESIGNATION');
  // Always keep the employee's CURRENT value selectable — production/legacy records
  // may hold a designation or grade the admin never added to the master list. Without
  // this, the dropdown would silently drop their existing value on edit.
  const designationChoices = React.useMemo(() => {
    const base = designationOptions.length > 0 ? designationOptions : [...DESIGNATION_OPTIONS];
    const cur = officialDetails.designation;
    return cur && !base.includes(cur) ? [cur, ...base] : base;
  }, [designationOptions, officialDetails.designation]);
  const gradeChoices = React.useMemo(() => {
    const cur = officialDetails.grade;
    return cur && !gradeOptions.includes(cur) ? [cur, ...gradeOptions] : gradeOptions;
  }, [gradeOptions, officialDetails.grade]);
  
  // Dropdown options state
  const [companies, setCompanies] = useState<Array<{ label: string; value: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ label: string; value: string }>>([]);
  const [locations, setLocations] = useState<Array<{ label: string; value: string }>>([]);
  const [businessUnits, setBusinessUnits] = useState<Array<{ label: string; value: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  
  // Cascading selection state
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | undefined>();
  const [selectedBU, setSelectedBU] = useState<string | undefined>();
  const [selectedBUName, setSelectedBUName] = useState<string | undefined>();
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string | undefined>();
  const [selectedLocationName, setSelectedLocationName] = useState<string | undefined>();

  // Initialize state from existing data when entering edit mode
  useEffect(() => {
    if (localEditing && officialDetails) {
      // Set initial organization if exists
      if (officialDetails.organizationHandle) {
        setSelectedCompany(officialDetails.organizationHandle);
        setSelectedCompanyName(officialDetails.organizationName || '');
      }
      
      // Set initial location name if exists
      if (officialDetails.locationName) {
        setSelectedLocationName(officialDetails.locationName);
      }
      
      fetchDropdownOptions();
    }
  }, [localEditing]);

  // Set organization field value after companies are loaded.
  // Match tolerantly: by stored handle, then by display name; and fall back to the
  // only company when there is just one. Older/imported employees may have an empty
  // organizationName/Handle, so a strict name-only match left the field blank and
  // tripped the "Required" validation on save.
  useEffect(() => {
    if (companiesLoaded && localEditing && companies.length > 0) {
      const site = getOrganizationId();
      const matchingCompany =
        companies.find(c => c.value === officialDetails.organizationHandle) ||
        companies.find(c => c.label === officialDetails.organizationName) ||
        // Imported/older employees may have no stored company: default to the
        // company matching the employee's site, then to the only company.
        companies.find(c => c.label === site || c.value === site) ||
        (companies.length === 1 ? companies[0] : undefined);
      if (matchingCompany) {
        form.setFieldsValue({ organization: matchingCompany.value });
        // Also trigger the state update to load business units
        setSelectedCompany(matchingCompany.value);
        setSelectedCompanyName(matchingCompany.label);
      }
    }
  }, [companiesLoaded, localEditing, companies]);

  // Load business units when company is selected
  useEffect(() => {
    const loadBusinessUnits = async () => {
      if (selectedCompany) {
        try {
          const organizationId = getOrganizationId();
          const data = await HrmOrganizationService.fetchBusinessUnits(organizationId, selectedCompany);
          const buOptions = (data || []).map((bu) => ({
            label: `${bu.buCode} - ${bu.buName}`,
            value: bu.handle,
            name: bu.buName, // Store the name separately
          }));
          setBusinessUnits(buOptions);
          
          // Rehydrate the BU. The stored value may be the label ("MES1 - MES1"),
          // the handle, or the bare name depending on how the record was created
          // (form vs import). Match tolerantly, and fall back to the only BU.
          if (localEditing) {
            const existingBU = (officialDetails.businessUnits && officialDetails.businessUnits.length > 0)
              ? officialDetails.businessUnits[0] : undefined;
            const matchingBU =
              (existingBU && buOptions.find(bu => bu.label === existingBU)) ||
              (existingBU && buOptions.find(bu => bu.value === existingBU)) ||
              (existingBU && buOptions.find(bu => bu.name === existingBU)) ||
              (buOptions.length === 1 ? buOptions[0] : undefined);
            if (matchingBU) {
              setSelectedBU(matchingBU.value);
              setSelectedBUName(matchingBU.label);
              form.setFieldsValue({ businessUnit: matchingBU.value });
            }
          }
        } catch (error) {
          console.error('Failed to load business units:', error);
          message.error('Failed to load business units');
        }
      } else {
        setBusinessUnits([]);
      }
    };
    loadBusinessUnits();
  }, [selectedCompany]);

  // Load departments when business unit is selected
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedBU) {
        try {
          const organizationId = getOrganizationId();
          const data = await HrmOrganizationService.fetchDepartments(organizationId, selectedBU);
          const deptOptions = (data || []).map((dept) => ({
            label: `${dept.deptCode} - ${dept.deptName}`,
            value: dept.handle,
            name: dept.deptName, // Store the name separately
          }));
          setDepartments(deptOptions);
          
          // Rehydrate the department tolerantly (label / handle / name), with a
          // single-option fallback — same reasoning as the BU match above.
          if (localEditing) {
            const dept = officialDetails.department;
            const matchingDept =
              (dept && deptOptions.find(d => d.label === dept)) ||
              (dept && deptOptions.find(d => d.value === dept)) ||
              (dept && deptOptions.find(d => d.name === dept)) ||
              (deptOptions.length === 1 ? deptOptions[0] : undefined);
            if (matchingDept) {
              setSelectedDepartmentName(matchingDept.label);
              form.setFieldsValue({ department: matchingDept.value });
            }
          }
        } catch (error) {
          console.error('Failed to load departments:', error);
          message.error('Failed to load departments');
        }
      } else {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, [selectedBU]);

  const fetchDropdownOptions = async () => {
    setLoadingOptions(true);
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        message.error('Site not found');
        return;
      }

      // Fetch companies/organizations
      try {
        const response = await HrmOrganizationService.fetchBySite(organizationId);
        const companyData = Array.isArray(response) ? response : [response];
        const companyOptions = companyData.map((company) => ({
          label: company.companyName || company.legalName || company.tradeName || company.handle,
          value: company.handle,
        }));
        setCompanies(companyOptions);
        setCompaniesLoaded(true);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        message.error('Failed to load companies. Please refresh.');
      }

      // Fetch locations
      try {
        const locationsData = await HrmOrganizationService.fetchAllLocations(organizationId);
        setLocations(
          locationsData.map((loc) => ({
            label: loc.name || loc.code || loc.id,
            value: loc.id,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        message.error('Failed to load locations');
      }

      // Fetch employees for reporting manager dropdown.
      // The reporting manager Select MUST store the manager's employeeCode,
      // not their UUID handle. BE workflow services (expense / travel /
      // leave) read employee.reportingManager to populate currentApproverId
      // on submitted requests; supervisor inbox queries filter by bare
      // employeeCode. Storing UUID here was breaking every approval inbox
      // (supervisor inbox returned 0 records).
      try {
        const employeesData = await HrmEmployeeService.fetchDirectory({ organizationId, page: 0, size: 1000 });
        setEmployees(
          (employeesData.employees || []).map((emp) => ({
            label: `${emp.fullName} (${emp.employeeCode})`,
            value: emp.employeeCode,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        message.error('Failed to load employees');
      }
      
    } catch (error) {
      console.error('Failed to fetch dropdown options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'official') {
      setLocalEditing(true);
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      await onSave('official', {
        firstName: values.firstName,
        lastName: values.lastName,
        title: values.title,
        department: selectedDepartmentName || '', // Send department with code (e.g., "RITS - RITS")
        role: values.role,
        designation: values.designation,
        grade: values.grade,
        reportingManager: values.reportingManager,
        reportingManagerName: officialDetails.reportingManagerName, // Preserve existing name
        location: values.location,
        locationName: selectedLocationName || '', // Add location name
        businessUnits: selectedBUName ? [selectedBUName] : [], // Send as array with full label (e.g., ["BU983383 - BUPAY Updated"])
        organizationName: selectedCompanyName || '', // Newly added
        organizationHandle: selectedCompany || '', // Newly added
        joiningDate: values.joiningDate
          ? values.joiningDate.format('YYYY-MM-DD')
          : officialDetails.joiningDate,
        employmentStatus: values.employmentStatus || undefined,
        probationEndDate: values.probationEndDate
          ? values.probationEndDate.format('YYYY-MM-DD')
          : undefined,
        lastWorkingDay: values.lastWorkingDay
          ? values.lastWorkingDay.format('YYYY-MM-DD')
          : undefined,
      });
      setLocalEditing(false);
    } catch {
      // validation error
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    cancel: () => {
      setLocalEditing(false);
      form.resetFields();
    },
  }));

  const editing = localEditing;

  // The reporting-manager dropdown is keyed by employeeCode, but a manager assigned
  // via Bulk Ops is stored as a UUID handle — that value matches no option, so the
  // Select would show the raw ID. Inject the current manager (labelled with the
  // resolved name) so edit mode shows the name instead of the ID. Storage is untouched.
  const managerOptions = React.useMemo(() => {
    const mgr = officialDetails.reportingManager;
    if (mgr && !employees.some((e) => e.value === mgr)) {
      const label = officialDetails.reportingManagerName
        ? `${officialDetails.reportingManagerName} (${mgr})`
        : mgr;
      return [{ label, value: mgr }, ...employees];
    }
    return employees;
  }, [employees, officialDetails.reportingManager, officialDetails.reportingManagerName]);

  if (editing) {
    return (
      <div className={styles.tabContent}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            firstName: officialDetails.firstName,
            lastName: officialDetails.lastName,
            title: officialDetails.title,
            // organization will be set after companies load
            // businessUnit will be set after BUs load  
            department: officialDetails.department,
            role: officialDetails.role,
            designation: officialDetails.designation,
            grade: officialDetails.grade,
            reportingManager: officialDetails.reportingManager,
            location: officialDetails.location,
            joiningDate: officialDetails.joiningDate
              ? dayjs(officialDetails.joiningDate)
              : undefined,
            employmentStatus: officialDetails.employmentStatus,
            probationEndDate: officialDetails.probationEndDate
              ? dayjs(officialDetails.probationEndDate)
              : undefined,
            lastWorkingDay: officialDetails.lastWorkingDay
              ? dayjs(officialDetails.lastWorkingDay)
              : undefined,
          }}
        >
          <div className={formStyles.editFormGrid}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="title" label="Title">
              <Select
                showSearch
                allowClear
                placeholder="Select or type title"
                options={[
                  { label: 'Mr', value: 'Mr' },
                  { label: 'Ms', value: 'Ms' },
                  { label: 'Mrs', value: 'Mrs' },
                  { label: 'Dr', value: 'Dr' },
                ]}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="organization"
              label="Organization"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select organization"
                loading={loadingOptions}
                options={companies}
                onChange={(value, option: any) => {
                  setSelectedCompany(value);
                  setSelectedCompanyName(option?.label || '');
                  setSelectedBU(undefined);
                  setSelectedBUName(undefined);
                  setSelectedDepartmentName(undefined);
                  form.setFieldsValue({ businessUnit: undefined, department: undefined });
                }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="businessUnit"
              label="Business Unit"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select business unit"
                loading={loadingOptions}
                options={businessUnits}
                disabled={!selectedCompany}
                onChange={(value, option: any) => {
                  setSelectedBU(value);
                  setSelectedBUName(option?.label || ''); // Use the full label with code
                  setSelectedDepartmentName(undefined);
                  form.setFieldsValue({ department: undefined });
                }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select department"
                loading={loadingOptions}
                options={departments}
                disabled={!selectedBU}
                onChange={(value, option: any) => {
                  setSelectedDepartmentName(option?.label || ''); // Use the full label with code
                }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select role"
                options={[
                  { label: 'EMPLOYEE', value: 'EMPLOYEE' },
                  { label: 'MANAGER', value: 'MANAGER' },
                  { label: 'ADMIN', value: 'ADMIN' },
                  { label: 'HR', value: 'HR' },
                  { label: 'DIRECTOR', value: 'DIRECTOR' },
                ]}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="designation"
              label="Designation"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select designation"
                options={designationChoices.map((d) => ({ label: d, value: d }))}
                notFoundContent="No designations configured — add them in Employee Settings"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="grade"
              label="Grade"
              rules={[{ required: true, message: 'Grade is required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select grade"
                options={gradeChoices.map((g) => ({ label: g, value: g }))}
                notFoundContent="No grades configured — add them in Employee Settings"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="reportingManager" label="Reporting Manager">
              <Select
                showSearch
                allowClear
                placeholder="Select reporting manager"
                loading={loadingOptions}
                options={managerOptions}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select location"
                loading={loadingOptions}
                options={locations}
                onChange={(value, option: any) => {
                  setSelectedLocationName(option?.label || '');
                }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="joiningDate" label="Joining Date">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="employmentStatus" label="Employment Status">
              <Select
                allowClear
                placeholder="Select status"
                options={EMPLOYMENT_STATUS_OPTIONS}
              />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) =>
                prev.employmentStatus !== curr.employmentStatus
              }
            >
              {({ getFieldValue }) => {
                const status = getFieldValue('employmentStatus') as
                  | EmploymentStatus
                  | undefined;
                if (status === 'PROBATION') {
                  return (
                    <Form.Item
                      name="probationEndDate"
                      label="Probation End Date"
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                  );
                }
                if (status === 'NOTICE_PERIOD' || status === 'TERMINATED') {
                  return (
                    <Form.Item
                      name="lastWorkingDay"
                      label="Last Working Day"
                      rules={[
                        {
                          required: status === 'NOTICE_PERIOD',
                          message: 'Required for Notice Period',
                        },
                      ]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.detailGrid}>
        <EmpFieldLabel label="First Name" value={officialDetails.firstName} />
        <EmpFieldLabel label="Last Name" value={officialDetails.lastName} />
        <EmpFieldLabel label="Title" value={officialDetails.title} />
        <EmpFieldLabel label="Organization" value={officialDetails.organizationName} />
        <EmpFieldLabel label="Department" value={officialDetails.department} />
        <EmpFieldLabel label="Role" value={officialDetails.role} />
        <EmpFieldLabel label="Designation" value={officialDetails.designation} />
        <EmpFieldLabel label="Grade" value={officialDetails.grade} />
        <EmpFieldLabel
          label="Reporting Manager" 
          value={officialDetails.reportingManagerName || officialDetails.reportingManager || '--'} 
        />
        <EmpFieldLabel 
          label="Location" 
          value={officialDetails.locationName || officialDetails.location || '--'} 
        />
        <EmpFieldLabel
          label="Business Units"
          value={officialDetails.businessUnits?.join(', ') || '--'}
        />
        <EmpFieldLabel label="Joining Date" value={formatDate(officialDetails.joiningDate)} />
        <EmpFieldLabel
          label="Employment Status"
          value={
            officialDetails.employmentStatus
              ? EMPLOYMENT_STATUS_LABEL[officialDetails.employmentStatus]
              : '--'
          }
        />
        {officialDetails.employmentStatus === 'PROBATION' && (
          <EmpFieldLabel
            label="Probation End Date"
            value={formatDate(officialDetails.probationEndDate)}
          />
        )}
        {(officialDetails.employmentStatus === 'NOTICE_PERIOD' ||
          officialDetails.employmentStatus === 'TERMINATED') && (
          <EmpFieldLabel
            label="Last Working Day"
            value={formatDate(officialDetails.lastWorkingDay)}
          />
        )}
      </div>
    </div>
  );
});

OfficialDetailsTab.displayName = 'OfficialDetailsTab';

export default OfficialDetailsTab;
