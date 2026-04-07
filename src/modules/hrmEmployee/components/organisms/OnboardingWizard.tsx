/**
 * OnboardingWizard - 4-step Ant Design Steps modal for creating a new employee
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Input, Select, DatePicker, Form, Divider, Checkbox, message } from 'antd';
import { parseCookies } from 'nookies';
import { useOnboardingWizard } from '../../hooks/useHrmEmployeeData';
import { useHrmEmployeeStore } from '../../stores/hrmEmployeeStore';
import { ONBOARDING_STEPS } from '../../utils/constants';
import type { CreateEmployeeRequest } from '../../types/api.types';
import formStyles from '../../styles/HrmEmployeeForm.module.css';
import { EmployeeKeycloakService } from '../../services/keycloakService';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';

/* Step 0: Basic Info */
const BasicStep: React.FC<{
  draft: Partial<CreateEmployeeRequest>;
  errors: Record<string, string>;
  onChange: (data: Partial<CreateEmployeeRequest>) => void;
}> = ({ draft, errors, onChange }) => (
  <div className={formStyles.wizardStepBody}>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          First Name
        </label>
        <Input
          value={draft.firstName || ''}
          onChange={(e) => onChange({ firstName: e.target.value })}
          status={errors.firstName ? 'error' : undefined}
          placeholder="John"
        />
        {errors.firstName && (
          <div className={formStyles.formFieldError}>{errors.firstName}</div>
        )}
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Last Name
        </label>
        <Input
          value={draft.lastName || ''}
          onChange={(e) => onChange({ lastName: e.target.value })}
          status={errors.lastName ? 'error' : undefined}
          placeholder="Doe"
        />
        {errors.lastName && (
          <div className={formStyles.formFieldError}>{errors.lastName}</div>
        )}
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Work Email
        </label>
        <Input
          value={draft.workEmail || ''}
          onChange={(e) => onChange({ workEmail: e.target.value })}
          status={errors.workEmail ? 'error' : undefined}
          placeholder="john.doe@company.com"
        />
        {errors.workEmail && (
          <div className={formStyles.formFieldError}>{errors.workEmail}</div>
        )}
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Phone
        </label>
        <Input
          value={draft.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
          status={errors.phone ? 'error' : undefined}
          placeholder="+91 98765 43210"
        />
        {errors.phone && (
          <div className={formStyles.formFieldError}>{errors.phone}</div>
        )}
      </div>
    </div>
  </div>
);

/* Step 1: Official Details */
const OfficialStep: React.FC<{
  draft: Partial<CreateEmployeeRequest>;
  errors: Record<string, string>;
  onChange: (data: Partial<CreateEmployeeRequest>) => void;
  keycloakSettings: {
    createKeycloakUser: boolean;
    username: string;
    temporaryPassword: string;
    sendCredentialsEmail: boolean;
  };
  onKeycloakChange: (settings: any) => void;
}> = ({ draft, errors, onChange, keycloakSettings, onKeycloakChange }) => {
  const [companies, setCompanies] = React.useState<Array<{ label: string; value: string }>>([]);
  const [departments, setDepartments] = React.useState<Array<{ label: string; value: string }>>([]);
  const [locations, setLocations] = React.useState<Array<{ label: string; value: string }>>([]);
  const [businessUnits, setBusinessUnits] = React.useState<Array<{ label: string; value: string }>>([]);
  const [employees, setEmployees] = React.useState<Array<{ label: string; value: string }>>([]);
  const [selectedCompany, setSelectedCompany] = React.useState<string | undefined>();
  const [selectedCompanyName, setSelectedCompanyName] = React.useState<string | undefined>();
  const [selectedBU, setSelectedBU] = React.useState<string | undefined>();

  // Load initial dropdown options
  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const cookies = parseCookies();
        const site = cookies.site || 'RITS';

        // Fetch companies
        const companyResponse = await HrmOrganizationService.fetchBySite(site);
        const companyData = Array.isArray(companyResponse) ? companyResponse : [companyResponse];
        setCompanies(companyData.map((c) => ({
          label: c.companyName || c.legalName || c.tradeName || c.handle,
          value: c.handle,
        })));

        // Fetch locations
        const locationsData = await HrmOrganizationService.fetchAllLocations(site);
        setLocations(locationsData.map((loc) => ({
          label: loc.name || loc.code || loc.id,
          value: loc.id,
        })));

        // Fetch employees for reporting manager
        const employeesData = await HrmEmployeeService.fetchDirectory({ site, page: 0, size: 1000 });
        setEmployees((employeesData.employees || []).map((emp) => ({
          label: `${emp.fullName} (${emp.employeeCode})`,
          value: emp.handle,
        })));
      } catch (error) {
        console.error('Failed to fetch dropdown options:', error);
      }
    };
    fetchOptions();
  }, []);

  // Load business units when company is selected
  React.useEffect(() => {
    const loadBusinessUnits = async () => {
      if (selectedCompany) {
        try {
          const cookies = parseCookies();
          const site = cookies.site || 'RITS';
          const data = await HrmOrganizationService.fetchBusinessUnits(site, selectedCompany);
          setBusinessUnits((data || []).map((bu) => ({
            label: `${bu.buCode} - ${bu.buName}`,
            value: bu.handle,
          })));
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
  React.useEffect(() => {
    const loadDepartments = async () => {
      if (selectedBU) {
        try {
          const cookies = parseCookies();
          const site = cookies.site || 'RITS';
          const data = await HrmOrganizationService.fetchDepartments(site, selectedBU);
          setDepartments((data || []).map((dept) => ({
            label: `${dept.deptCode} - ${dept.deptName}`,
            value: dept.handle,
          })));
        } catch (error) {
          console.error('Failed to load departments:', error);
        }
      } else {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, [selectedBU]);

  return (
  <div className={formStyles.wizardStepBody}>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Company/Organization</label>
        <Select
          value={selectedCompany || undefined}
          onChange={(val, option: any) => {
            setSelectedCompany(val);
            setSelectedCompanyName(option?.label || '');
            setSelectedBU(undefined); // Reset BU when company changes
            onChange({ 
              businessUnits: [], // Clear business units
              organizationHandle: val,
              organizationName: option?.label || ''
            });
          }}
          placeholder="Select company"
          style={{ width: '100%' }}
          options={companies}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Title</label>
        <Select
          value={draft.title || undefined}
          onChange={(val) => onChange({ title: val })}
          placeholder="Select title"
          style={{ width: '100%' }}
          options={[
            { label: 'Mr.', value: 'Mr.' },
            { label: 'Ms.', value: 'Ms.' },
            { label: 'Mrs.', value: 'Mrs.' },
            { label: 'Dr.', value: 'Dr.' },
          ]}
          allowClear
        />
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Business Units
        </label>
        <Select
          value={draft.businessUnits?.[0] || undefined}
          onChange={(val) => {
            const selected = businessUnits.find(bu => bu.value === val);
            onChange({ businessUnits: selected ? [selected.label] : [] });
            setSelectedBU(val);
          }}
          placeholder="Select business unit"
          style={{ width: '100%' }}
          options={businessUnits}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          disabled={!selectedCompany}
          notFoundContent={selectedCompany ? 'No business units found' : 'Please select company first'}
        />
        {errors.businessUnits && (
          <div className={formStyles.formFieldError}>{errors.businessUnits}</div>
        )}
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Department
        </label>
        <Select
          value={draft.department || undefined}
          onChange={(val) => {
            const selected = departments.find(d => d.value === val);
            onChange({ department: selected?.label || val });
          }}
          status={errors.department ? 'error' : undefined}
          placeholder="Select department"
          style={{ width: '100%' }}
          options={departments}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          disabled={!selectedBU}
          notFoundContent={selectedBU ? 'No departments found' : 'Please select business unit first'}
        />
        {errors.department && (
          <div className={formStyles.formFieldError}>{errors.department}</div>
        )}
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Role
        </label>
        <Select
          value={draft.role || undefined}
          onChange={(val) => onChange({ role: val })}
          status={errors.role ? 'error' : undefined}
          placeholder="Select role"
          style={{ width: '100%' }}
          options={[
            { label: 'EMPLOYEE', value: 'EMPLOYEE' },
            { label: 'MANAGER', value: 'MANAGER' },
            { label: 'ADMIN', value: 'ADMIN' },
            { label: 'HR', value: 'HR' },
          ]}
        />
        {errors.role && (
          <div className={formStyles.formFieldError}>{errors.role}</div>
        )}
      </div>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Designation</label>
        <Input
          value={draft.designation || ''}
          onChange={(e) => onChange({ designation: e.target.value })}
          placeholder="Software Engineer"
        />
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Reporting Manager</label>
        <Select
          value={draft.reportingManager || undefined}
          onChange={(val) => onChange({ reportingManager: val })}
          placeholder="Select reporting manager"
          style={{ width: '100%' }}
          options={employees}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          allowClear
        />
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Location
        </label>
        <Select
          value={draft.location || undefined}
          onChange={(val) => onChange({ location: val })}
          status={errors.location ? 'error' : undefined}
          placeholder="Select location"
          style={{ width: '100%' }}
          options={locations}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        {errors.location && (
          <div className={formStyles.formFieldError}>{errors.location}</div>
        )}
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Joining Date
        </label>
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          onChange={(date) =>
            onChange({ joiningDate: date ? date.format('YYYY-MM-DD') : '' })
          }
        />
        {errors.joiningDate && (
          <div className={formStyles.formFieldError}>{errors.joiningDate}</div>
        )}
      </div>
    </div>

    <Divider dashed style={{ margin: '12px 0' }} />

    <div className={formStyles.formSectionTitle}>Login Credentials (Optional)</div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField} style={{ width: '100%' }}>
        <Checkbox
          checked={keycloakSettings.createKeycloakUser}
          onChange={(e) => onKeycloakChange({
            ...keycloakSettings,
            createKeycloakUser: e.target.checked
          })}
        >
          Create login credentials for this employee
        </Checkbox>
      </div>
    </div>

    {keycloakSettings.createKeycloakUser && (
      <>
        <div className={formStyles.formRow}>
          <div className={formStyles.formField}>
            <label className={formStyles.formFieldLabel}>Username</label>
            <Input
              value={keycloakSettings.username || draft.workEmail || ''}
              onChange={(e) => onKeycloakChange({
                ...keycloakSettings,
                username: e.target.value
              })}
              placeholder="Will use work email if empty"
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Leave empty to use work email as username
            </div>
          </div>
          <div className={formStyles.formField}>
            <label className={formStyles.formFieldLabel}>Temporary Password</label>
            <Input.Password
              value={keycloakSettings.temporaryPassword}
              onChange={(e) => onKeycloakChange({
                ...keycloakSettings,
                temporaryPassword: e.target.value
              })}
              placeholder="Auto-generated if empty"
              addonAfter={
                <Button
                  size="small"
                  onClick={() => onKeycloakChange({
                    ...keycloakSettings,
                    temporaryPassword: EmployeeKeycloakService.generateTemporaryPassword()
                  })}
                >
                  Generate
                </Button>
              }
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Leave empty to auto-generate secure password
            </div>
          </div>
        </div>
        <div className={formStyles.formRow}>
          <div className={formStyles.formField} style={{ width: '100%' }}>
            <Checkbox
              checked={keycloakSettings.sendCredentialsEmail}
              onChange={(e) => onKeycloakChange({
                ...keycloakSettings,
                sendCredentialsEmail: e.target.checked
              })}
            >
              Send credentials via email (credentials will be displayed on screen)
            </Checkbox>
          </div>
        </div>
      </>
    )}
  </div>
  );
};

/* Step 2: Contact Info */
const ContactStep: React.FC<{
  draft: Partial<CreateEmployeeRequest>;
  onChange: (data: Partial<CreateEmployeeRequest>) => void;
}> = ({ draft, onChange }) => {
  const defaultAddr = { line1: '', line2: '', city: '', state: '', pinCode: '', country: 'India' };
  const addr = (typeof draft.presentAddress === 'object' && draft.presentAddress) ? draft.presentAddress : defaultAddr;

  return (
    <div className={formStyles.wizardStepBody}>
      <div className={formStyles.formSectionTitle}>Present Address</div>
      <div className={formStyles.formRow}>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>Address Line 1</label>
          <Input
            value={addr.line1}
            onChange={(e) =>
              onChange({ presentAddress: { ...addr, line1: e.target.value } })
            }
          />
        </div>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>Address Line 2</label>
          <Input
            value={addr.line2 || ''}
            onChange={(e) =>
              onChange({ presentAddress: { ...addr, line2: e.target.value } })
            }
          />
        </div>
      </div>
      <div className={formStyles.formRow}>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>City</label>
          <Input
            value={addr.city}
            onChange={(e) =>
              onChange({ presentAddress: { ...addr, city: e.target.value } })
            }
          />
        </div>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>State</label>
          <Input
            value={addr.state}
            onChange={(e) =>
              onChange({ presentAddress: { ...addr, state: e.target.value } })
            }
          />
        </div>
      </div>
      <div className={formStyles.formRow}>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>PIN Code</label>
          <Input
            value={addr.pinCode}
            onChange={(e) =>
              onChange({ presentAddress: { ...addr, pinCode: e.target.value } })
            }
          />
        </div>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>Country</label>
          <Input
            value={addr.country}
            onChange={(e) =>
              onChange({ presentAddress: { ...addr, country: e.target.value } })
            }
          />
        </div>
      </div>

      <Divider dashed style={{ margin: '12px 0' }} />

      <div className={formStyles.formSectionTitle}>Emergency Contacts (Optional)</div>
      <div className={formStyles.formRow}>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>Contact Name</label>
          <Input
            placeholder="Emergency contact name"
            onChange={(e) => {
              const existing = draft.emergencyContacts?.[0] || { name: '', relationship: '', phone: '' };
              onChange({
                emergencyContacts: [{ ...existing, name: e.target.value }],
              });
            }}
          />
        </div>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>Relationship</label>
          <Input
            placeholder="e.g. Spouse, Parent"
            onChange={(e) => {
              const existing = draft.emergencyContacts?.[0] || { name: '', relationship: '', phone: '' };
              onChange({
                emergencyContacts: [{ ...existing, relationship: e.target.value }],
              });
            }}
          />
        </div>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>Phone</label>
          <Input
            placeholder="+91 ..."
            onChange={(e) => {
              const existing = draft.emergencyContacts?.[0] || { name: '', relationship: '', phone: '' };
              onChange({
                emergencyContacts: [{ ...existing, phone: e.target.value }],
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* Step 3: Review */
const ReviewStep: React.FC<{ draft: Partial<CreateEmployeeRequest> }> = ({ draft }) => (
  <div className={formStyles.wizardStepBody}>
    <div className={formStyles.reviewSection}>
      <div className={formStyles.reviewSectionTitle}>Basic Info</div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Name</span>
        <span className={formStyles.reviewValue}>
          {draft.firstName} {draft.lastName}
        </span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Email</span>
        <span className={formStyles.reviewValue}>{draft.workEmail}</span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Phone</span>
        <span className={formStyles.reviewValue}>{draft.phone}</span>
      </div>
    </div>

    <div className={formStyles.reviewSection}>
      <div className={formStyles.reviewSectionTitle}>Official Details</div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Department</span>
        <span className={formStyles.reviewValue}>{draft.department || '--'}</span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Role</span>
        <span className={formStyles.reviewValue}>{draft.role || '--'}</span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Designation</span>
        <span className={formStyles.reviewValue}>{draft.designation || '--'}</span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Location</span>
        <span className={formStyles.reviewValue}>{draft.location || '--'}</span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Joining Date</span>
        <span className={formStyles.reviewValue}>{draft.joiningDate || '--'}</span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Reporting Manager</span>
        <span className={formStyles.reviewValue}>{draft.reportingManager || '--'}</span>
      </div>
      <div className={formStyles.reviewRow}>
        <span className={formStyles.reviewLabel}>Business Units</span>
        <span className={formStyles.reviewValue}>
          {draft.businessUnits?.join(', ') || '--'}
        </span>
      </div>
    </div>

    {typeof draft.presentAddress === 'object' && draft.presentAddress?.line1 && (
      <div className={formStyles.reviewSection}>
        <div className={formStyles.reviewSectionTitle}>Contact</div>
        <div className={formStyles.reviewRow}>
          <span className={formStyles.reviewLabel}>Address</span>
          <span className={formStyles.reviewValue}>
            {[
              (draft.presentAddress as { line1?: string; line2?: string; city?: string; state?: string; pinCode?: string }).line1,
              (draft.presentAddress as { line2?: string }).line2,
              (draft.presentAddress as { city?: string }).city,
              (draft.presentAddress as { state?: string }).state,
              (draft.presentAddress as { pinCode?: string }).pinCode,
            ]
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
      </div>
    )}
  </div>
);

/* Main Wizard */
const OnboardingWizard: React.FC = () => {
  const {
    isOpen,
    currentStep,
    isSaving,
    draft,
    errors,
    closeOnboarding,
    setOnboardingStep,
    updateOnboardingDraft,
    submitOnboarding,
  } = useOnboardingWizard();

  const [keycloakSettings, setKeycloakSettings] = useState({
    createKeycloakUser: true, // Default to true
    username: '',
    temporaryPassword: '',
    sendCredentialsEmail: true,
  });

  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const [checkingEmail, setCheckingEmail] = useState(false);

  // Auto-fill username when work email changes
  useEffect(() => {
    if (draft.workEmail && keycloakSettings.createKeycloakUser && !keycloakSettings.username) {
      setKeycloakSettings(prev => ({
        ...prev,
        username: draft.workEmail || ''
      }));
    }
  }, [draft.workEmail, keycloakSettings.createKeycloakUser, keycloakSettings.username]);

  const isLastStep = currentStep === 3;

  const handleNext = async () => {
    // If on Basic Info step (step 0), validate email before proceeding
    if (currentStep === 0 && draft.workEmail) {
      setCheckingEmail(true);
      try {
        const cookies = parseCookies();
        const site = cookies.site || 'RITS';
        
        console.log('Checking email availability for:', draft.workEmail);
        const result = await HrmEmployeeService.checkEmailAvailability(site, draft.workEmail);
        console.log('Email check result:', result);
        
        // If email is NOT available (already taken), show error and stop
        if (!result.available) {
          message.error('This email is already registered. Please use a different email.');
          setCheckingEmail(false);
          return; // Don't proceed to next step
        }
        
        // Email is available, proceed to next step
        console.log('Email is available, proceeding to next step');
      } catch (error) {
        console.error('Email check failed:', error);
        message.warning('Could not verify email availability. Please proceed with caution.');
      } finally {
        setCheckingEmail(false);
      }
    }
    
    // Proceed to next step
    setOnboardingStep(currentStep + 1);
  };

  const handleSubmitWithKeycloak = async () => {
    console.log('handleSubmitWithKeycloak called', { keycloakSettings });
    
    try {
      // Step 1: Create employee first - call store directly to get proper typing
      const createdEmployee = await useHrmEmployeeStore.getState().submitOnboarding();
      
      console.log('Employee created:', createdEmployee);
      
      if (!createdEmployee) {
        throw new Error('Failed to create employee');
      }

      // Step 2: Create Keycloak user if requested, using employeeCode as username
      if (keycloakSettings.createKeycloakUser && createdEmployee.employeeCode) {
        console.log('Creating Keycloak user with employeeCode:', createdEmployee.employeeCode);
        
        const username = createdEmployee.employeeCode; // Use employeeCode from response
        const password = keycloakSettings.temporaryPassword || EmployeeKeycloakService.generateTemporaryPassword();

        console.log('Calling Keycloak API with username:', username);

        const keycloakResult = await EmployeeKeycloakService.createUserForEmployee({
          workEmail: createdEmployee.basicDetails.workEmail,
          firstName: draft.firstName || '',
          lastName: draft.lastName || '',
          password: password,
          username: username, // Pass employeeCode as username
        });

        console.log('Keycloak result:', keycloakResult);

        if (!keycloakResult.success) {
          message.warning(`Employee created successfully, but Keycloak user creation failed: ${keycloakResult.error || 'Unknown error'}`);
        } else {
          Modal.success({
            title: 'Employee Created Successfully',
            content: (
              <div>
                <p>Employee and login credentials have been created:</p>
                <p><strong>Username:</strong> {username}</p>
                <p><strong>Temporary Password:</strong> {password}</p>
                <p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                  Please share these credentials with the employee securely.
                </p>
              </div>
            ),
            width: 500,
          });
        }
      } else {
        console.log('Skipping Keycloak creation:', {
          createKeycloakUser: keycloakSettings.createKeycloakUser,
          employeeCode: createdEmployee?.employeeCode,
        });
      }

      // Reset Keycloak settings
      setKeycloakSettings({
        createKeycloakUser: true,
        username: '',
        temporaryPassword: '',
        sendCredentialsEmail: true,
      });

    } catch (error: any) {
      console.error('Error in handleSubmitWithKeycloak:', error);
      message.error(error.message || 'Failed to create employee');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicStep draft={draft} errors={errors} onChange={updateOnboardingDraft} />;
      case 1:
        return (
          <OfficialStep 
            draft={draft} 
            errors={errors} 
            onChange={updateOnboardingDraft}
            keycloakSettings={keycloakSettings}
            onKeycloakChange={setKeycloakSettings}
          />
        );
      case 2:
        return <ContactStep draft={draft} onChange={updateOnboardingDraft} />;
      case 3:
        return <ReviewStep draft={draft} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Add New Employee"
      open={isOpen}
      onCancel={closeOnboarding}
      width={700}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={closeOnboarding}>
          Cancel
        </Button>,
        currentStep > 0 && (
          <Button key="prev" onClick={() => setOnboardingStep(currentStep - 1)}>
            Previous
          </Button>
        ),
        !isLastStep && (
          <Button
            key="next"
            type="primary"
            onClick={handleNext}
            loading={checkingEmail}
          >
            {checkingEmail ? 'Checking...' : 'Next'}
          </Button>
        ),
        isLastStep && (
          <Button
            key="submit"
            type="primary"
            loading={isSaving}
            onClick={handleSubmitWithKeycloak}
          >
            Submit
          </Button>
        ),
      ].filter(Boolean)}
    >
      <div className={formStyles.wizardContent}>
        <Steps
          current={currentStep}
          size="small"
          items={ONBOARDING_STEPS.map((s) => ({
            title: s.title,
            description: s.description,
          }))}
          style={{ marginBottom: 20 }}
        />
        {renderStep()}
      </div>
    </Modal>
  );
};

export default OnboardingWizard;
