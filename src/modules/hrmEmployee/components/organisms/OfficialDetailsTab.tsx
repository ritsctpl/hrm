/**
 * OfficialDetailsTab - View/edit official employment details
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Button, Input, Form, Select, DatePicker, message } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import { formatDate } from '../../utils/transformations';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { ProfileTabProps } from '../../types/ui.types';
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

  // Initialize state from existing data when entering edit mode
  useEffect(() => {
    if (localEditing && officialDetails) {
      // Set initial organization if exists
      if (officialDetails.organizationHandle) {
        setSelectedCompany(officialDetails.organizationHandle);
        setSelectedCompanyName(officialDetails.organizationName || '');
      }
      
      fetchDropdownOptions();
    }
  }, [localEditing]);

  // Set organization field value after companies are loaded
  useEffect(() => {
    if (companiesLoaded && localEditing && officialDetails.organizationName && companies.length > 0) {
      // Find the matching company by name (label)
      const matchingCompany = companies.find(c => c.label === officialDetails.organizationName);
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
          const site = parseCookies().site;
          const data = await HrmOrganizationService.fetchBusinessUnits(site, selectedCompany);
          const buOptions = (data || []).map((bu) => ({
            label: `${bu.buCode} - ${bu.buName}`,
            value: bu.handle,
            name: bu.buName, // Store the name separately
          }));
          setBusinessUnits(buOptions);
          
          // If we have existing businessUnits data, find and set the matching BU
          if (localEditing && officialDetails.businessUnits && officialDetails.businessUnits.length > 0) {
            const existingBU = officialDetails.businessUnits[0]; // Get first BU from array
            const matchingBU = buOptions.find(bu => bu.label === existingBU);
            if (matchingBU) {
              setSelectedBU(matchingBU.value);
              setSelectedBUName(matchingBU.label);
              form.setFieldsValue({ businessUnit: matchingBU.value });
            }
          }
        } catch (error) {
          console.error('Failed to load business units:', error);
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
          const site = parseCookies().site;
          const data = await HrmOrganizationService.fetchDepartments(site, selectedBU);
          const deptOptions = (data || []).map((dept) => ({
            label: `${dept.deptCode} - ${dept.deptName}`,
            value: dept.handle,
            name: dept.deptName, // Store the name separately
          }));
          setDepartments(deptOptions);
          
          // If we have existing department data, find and set the matching department
          if (localEditing && officialDetails.department) {
            const matchingDept = deptOptions.find(dept => dept.label === officialDetails.department);
            if (matchingDept) {
              setSelectedDepartmentName(matchingDept.label);
              form.setFieldsValue({ department: matchingDept.value });
            }
          }
        } catch (error) {
          console.error('Failed to load departments:', error);
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
      const site = parseCookies().site;
      if (!site) {
        message.error('Site not found');
        return;
      }

      // Fetch companies/organizations
      try {
        const response = await HrmOrganizationService.fetchBySite(site);
        const companyData = Array.isArray(response) ? response : [response];
        const companyOptions = companyData.map((company) => ({
          label: company.companyName || company.legalName || company.tradeName || company.handle,
          value: company.handle,
        }));
        setCompanies(companyOptions);
        setCompaniesLoaded(true);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }

      // Fetch locations
      try {
        const locationsData = await HrmOrganizationService.fetchAllLocations(site);
        setLocations(
          locationsData.map((loc) => ({
            label: loc.name || loc.code || loc.id,
            value: loc.id,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }

      // Fetch employees for reporting manager dropdown
      try {
        const employeesData = await HrmEmployeeService.fetchDirectory({ site, page: 0, size: 1000 });
        setEmployees(
          (employeesData.employees || []).map((emp) => ({
            label: `${emp.fullName} (${emp.employeeCode})`,
            value: emp.handle,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch employees:', error);
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
        reportingManager: values.reportingManager,
        reportingManagerName: officialDetails.reportingManagerName, // Preserve existing name
        location: values.location,
        businessUnits: selectedBUName ? [selectedBUName] : [], // Send as array with full label (e.g., ["BU983383 - BUPAY Updated"])
        organizationName: selectedCompanyName || '', // Newly added
        organizationHandle: selectedCompany || '', // Newly added
        joiningDate: values.joiningDate
          ? values.joiningDate.format('YYYY-MM-DD')
          : officialDetails.joiningDate,
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
            reportingManager: officialDetails.reportingManager,
            location: officialDetails.location,
            joiningDate: officialDetails.joiningDate
              ? dayjs(officialDetails.joiningDate)
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
                options={[
                  { label: 'Software Engineer', value: 'Software Engineer' },
                  { label: 'Senior Software Engineer', value: 'Senior Software Engineer' },
                  { label: 'Team Lead', value: 'Team Lead' },
                  { label: 'Manager', value: 'Manager' },
                  { label: 'Senior Manager', value: 'Senior Manager' },
                  { label: 'Director', value: 'Director' },
                  { label: 'HR Executive', value: 'HR Executive' },
                  { label: 'HR Manager', value: 'HR Manager' },
                ]}
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
                options={employees}
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
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="joiningDate" label="Joining Date">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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
        <EmpFieldLabel 
          label="Reporting Manager" 
          value={officialDetails.reportingManagerName || officialDetails.reportingManager || '--'} 
        />
        <EmpFieldLabel label="Location" value={officialDetails.location} />
        <EmpFieldLabel
          label="Business Units"
          value={officialDetails.businessUnits?.join(', ') || '--'}
        />
        <EmpFieldLabel label="Joining Date" value={formatDate(officialDetails.joiningDate)} />
      </div>
    </div>
  );
});

OfficialDetailsTab.displayName = 'OfficialDetailsTab';

export default OfficialDetailsTab;
