/**
 * OnboardingWizard - 4-step Ant Design Steps modal for creating a new employee
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AutoComplete, Modal, Steps, Button, Input, Select, DatePicker, Form, Divider, Checkbox, message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useOnboardingWizard } from '../../hooks/useHrmEmployeeData';
import Can from '../../../hrmAccess/components/Can';
import { ONBOARDING_STEPS, DESIGNATION_OPTIONS } from '../../utils/constants';
import type { CreateEmployeeRequest } from '../../types/api.types';
import formStyles from '../../styles/HrmEmployeeForm.module.css';
import { EmployeeKeycloakService } from '../../services/keycloakService';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import { HrmLeaveService } from '@/modules/hrmLeave/services/hrmLeaveService';
import { COUNTRY_OPTIONS, COUNTRY_STATES } from '@/modules/hrmOrganization/utils/constants';
import { STATE_CITIES } from '@/modules/hrmOrganization/utils/locationSearch';
import dayjs from 'dayjs';

// Onboarding's Location field is captured as "State, Country" — a free
// combination of the two static lists from hrmOrganization/utils, NOT a
// /location record. parseLocationState / parseLocationCountry split the
// stored string back out for the dropdowns; composeLocation rebuilds it.
function parseLocationState(value: string | undefined): string {
  if (!value) return '';
  const idx = value.lastIndexOf(',');
  return idx >= 0 ? value.slice(0, idx).trim() : '';
}

function parseLocationCountry(value: string | undefined): string {
  if (!value) return '';
  const idx = value.lastIndexOf(',');
  return idx >= 0 ? value.slice(idx + 1).trim() : value.trim();
}

function composeLocation(state: string, country: string): string {
  const c = (country || '').trim();
  const s = (state || '').trim();
  if (s && c) return `${s}, ${c}`;
  return c || s;
}

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
          Employee Code
        </label>
        <Input
          value={draft.employeeCode || ''}
          onChange={(e) =>
            onChange({ employeeCode: e.target.value.toUpperCase().replace(/\s+/g, '') })
          }
          status={errors.employeeCode ? 'error' : undefined}
          placeholder="e.g. EMP0012"
          maxLength={20}
          style={{ width: '100%' }}
        />
        {errors.employeeCode && (
          <div className={formStyles.formFieldError}>{errors.employeeCode}</div>
        )}
      </div>
      <div className={formStyles.formField} />
    </div>
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
          style={{ width: '100%' }}
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
          style={{ width: '100%' }}
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
          style={{ width: '100%' }}
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
          style={{ width: '100%' }}
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
  // Dropdown props
  companies: Array<{ label: string; value: string }>;
  departments: Array<{ label: string; value: string }>;
  businessUnits: Array<{ label: string; value: string }>;
  employees: Array<{ label: string; value: string }>;
  loadingOptions: boolean;
  selectedCompany: string | undefined;
  selectedBU: string | undefined;
  onCompanyChange: (value: string, label: string) => void;
  onBUChange: (value: string, label: string) => void;
  onDepartmentChange: (value: string, label: string) => void;
}> = ({
  draft,
  errors,
  onChange,
  keycloakSettings,
  onKeycloakChange,
  companies,
  departments,
  businessUnits,
  employees,
  loadingOptions,
  selectedCompany,
  selectedBU,
  onCompanyChange,
  onBUChange,
  onDepartmentChange,
}) => (
  <div className={formStyles.wizardStepBody}>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Title</label>
        <Select
          showSearch
          allowClear
          value={draft.title || undefined}
          onChange={(value) => onChange({ title: value })}
          placeholder="Select or type title"
          style={{ width: '100%' }}
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
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Organization
        </label>
        <Select
          showSearch
          allowClear
          value={draft.organizationHandle || undefined}
          onChange={(value, option: any) => {
            onCompanyChange(value, option?.label || '');
          }}
          status={errors.organizationHandle ? 'error' : undefined}
          placeholder="Select organization"
          style={{ width: '100%' }}
          loading={loadingOptions}
          options={companies}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        {errors.organizationHandle && (
          <div className={formStyles.formFieldError}>{errors.organizationHandle}</div>
        )}
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Business Unit
        </label>
        <Select
          showSearch
          allowClear
          value={draft.businessUnits?.[0] || undefined}
          onChange={(value, option: any) => {
            onBUChange(value, option?.label || '');
          }}
          status={errors.businessUnits ? 'error' : undefined}
          placeholder="Select business unit"
          style={{ width: '100%' }}
          loading={loadingOptions}
          options={businessUnits}
          disabled={!selectedCompany}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
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
          showSearch
          allowClear
          value={draft.department || undefined}
          onChange={(value, option: any) => {
            onDepartmentChange(value, option?.label || '');
          }}
          status={errors.department ? 'error' : undefined}
          placeholder="Select department"
          style={{ width: '100%' }}
          loading={loadingOptions}
          options={departments}
          disabled={!selectedBU}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
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
          showSearch
          allowClear
          value={draft.role || undefined}
          onChange={(value) => onChange({ role: value })}
          status={errors.role ? 'error' : undefined}
          placeholder="Select role"
          style={{ width: '100%' }}
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
        {errors.role && (
          <div className={formStyles.formFieldError}>{errors.role}</div>
        )}
      </div>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Designation</label>
        <AutoComplete
          value={draft.designation || ''}
          onChange={(value) => onChange({ designation: value })}
          placeholder="Select or type designation"
          style={{ width: '100%' }}
          allowClear
          options={DESIGNATION_OPTIONS.map((d) => ({ value: d }))}
          filterOption={(input, option) =>
            (option?.value ?? '').toLowerCase().includes((input || '').toLowerCase())
          }
        />
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Reporting Manager</label>
        <Select
          showSearch
          allowClear
          value={draft.reportingManager || undefined}
          onChange={(value, option: any) =>
            onChange({
              reportingManager: value,
              reportingManagerName: value ? option?.label || '' : '',
            })
          }
          placeholder="Select reporting manager"
          style={{ width: '100%' }}
          loading={loadingOptions}
          options={employees}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Joining Date
        </label>
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          placeholder="Select joining date"
          status={errors.joiningDate ? 'error' : undefined}
          value={draft.joiningDate ? dayjs(draft.joiningDate) : null}
          onChange={(date) =>
            onChange({ joiningDate: date ? date.format('YYYY-MM-DD') : '' })
          }
        />
        {errors.joiningDate && (
          <div className={formStyles.formFieldError}>{errors.joiningDate}</div>
        )}
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Country
        </label>
        <Select
          showSearch
          value={parseLocationCountry(draft.location) || 'India'}
          onChange={(value) => {
            // Reset state when country switches — state list is country-scoped.
            onChange({ location: composeLocation('', value) });
          }}
          placeholder="Select country"
          style={{ width: '100%' }}
          options={[...COUNTRY_OPTIONS]}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          State
        </label>
        <Select
          showSearch
          allowClear
          value={parseLocationState(draft.location) || undefined}
          onChange={(value) => {
            const country = parseLocationCountry(draft.location) || 'India';
            onChange({ location: composeLocation(value || '', country) });
          }}
          status={errors.location ? 'error' : undefined}
          placeholder="Select state"
          style={{ width: '100%' }}
          options={(COUNTRY_STATES[parseLocationCountry(draft.location) || 'India'] || []).map(
            (s) => ({ label: s, value: s }),
          )}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        {errors.location && (
          <div className={formStyles.formFieldError}>{errors.location}</div>
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
          <label className={formStyles.formFieldLabel}>Country</label>
          <Select
            showSearch
            value={addr.country || 'India'}
            options={[...COUNTRY_OPTIONS]}
            onChange={(val) =>
              onChange({
                presentAddress: { ...addr, country: val, state: '', city: '' },
              })
            }
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          />
        </div>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>State</label>
          <Select
            showSearch
            allowClear
            value={addr.state || undefined}
            placeholder="Select state"
            options={(COUNTRY_STATES[addr.country || 'India'] || []).map((s) => ({
              label: s,
              value: s,
            }))}
            onChange={(val) =>
              onChange({
                presentAddress: { ...addr, state: val ?? '', city: '' },
              })
            }
            disabled={!addr.country}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div className={formStyles.formRow}>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>City</label>
          <Select
            showSearch
            allowClear
            value={addr.city || undefined}
            placeholder={addr.state ? 'Select city' : 'Select state first'}
            options={(STATE_CITIES[addr.state] || []).map((c) => ({
              label: c,
              value: c,
            }))}
            onChange={(val) =>
              onChange({
                presentAddress: { ...addr, city: val ?? '' },
              })
            }
            disabled={!addr.state}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            // Allow free text when the curated list misses a city.
            popupRender={(menu) => (
              <>
                {menu}
                {addr.state && (
                  <div style={{ borderTop: '1px solid #f0f0f0', padding: '6px 10px' }}>
                    <Input
                      size="small"
                      placeholder="Custom city — type + Enter"
                      onPressEnter={(e) => {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          onChange({
                            presentAddress: { ...addr, city: val },
                          });
                        }
                      }}
                    />
                  </div>
                )}
              </>
            )}
            style={{ width: '100%' }}
          />
        </div>
        <div className={formStyles.formField}>
          <label className={formStyles.formFieldLabel}>PIN Code</label>
          <Input
            value={addr.pinCode}
            onChange={(e) =>
              onChange({ presentAddress: { ...addr, pinCode: e.target.value } })
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
        <span className={formStyles.reviewLabel}>Employee Code</span>
        <span className={formStyles.reviewValue}>{draft.employeeCode || '--'}</span>
      </div>
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
        <span className={formStyles.reviewValue}>{draft.reportingManagerName || '--'}</span>
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
    createKeycloakUser: false,
    username: '',
    temporaryPassword: '',
    sendCredentialsEmail: true,
  });

  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  // Re-entry guard: handleSubmitWithKeycloak does its own pre-flight
  // checks (email + employee code + Keycloak conflict modal) before the
  // store-level isSaving flag goes true. Without this, a second click
  // on Submit during that window would fire a second create flow and
  // could even race the Modal.confirm — leading to "I clicked Cancel
  // and the employee got created anyway".
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [checkingEmail, setCheckingEmail] = useState(false);

  // Dropdown options state
  const [companies, setCompanies] = useState<Array<{ label: string; value: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ label: string; value: string }>>([]);
  const [businessUnits, setBusinessUnits] = useState<Array<{ label: string; value: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  // Existing employee codes within the org — used to block duplicates at
  // the wizard level since there's no /employee/check-code endpoint.
  // Populated from the same /directory call that builds the reporting
  // manager dropdown, so it's free of extra round-trips.
  const [existingEmployeeCodes, setExistingEmployeeCodes] = useState<Set<string>>(
    () => new Set<string>(),
  );

  // Cascading selection state
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | undefined>();
  const [selectedBU, setSelectedBU] = useState<string | undefined>();
  const [selectedBUName, setSelectedBUName] = useState<string | undefined>();
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string | undefined>();

  // Auto-fill username when work email changes
  useEffect(() => {
    if (draft.workEmail && keycloakSettings.createKeycloakUser && !keycloakSettings.username) {
      setKeycloakSettings(prev => ({
        ...prev,
        username: draft.workEmail || ''
      }));
    }
  }, [draft.workEmail, keycloakSettings.createKeycloakUser, keycloakSettings.username]);

  // Fetch dropdown options when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDropdownOptions();
    }
  }, [isOpen]);

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
          }));
          setBusinessUnits(buOptions);
        } catch (error) {
          console.error('Failed to load business units:', error);
        }
      } else {
        setBusinessUnits([]);
      }
    };
    loadBusinessUnits();
  }, [selectedCompany]);

  // Location is now a Country + State combination from static lists, not
  // sourced from /location or BU addresses — no per-company fetch needed.

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
          }));
          setDepartments(deptOptions);
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
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }

      // Fetch employees for reporting manager dropdown + capture the set
      // of existing employee codes for client-side duplicate detection.
      try {
        const employeesData = await HrmEmployeeService.fetchDirectory({ organizationId, page: 0, size: 1000 });
        const rows = employeesData.employees || [];
        setEmployees(
          rows.map((emp) => ({
            label: `${emp.fullName} (${emp.employeeCode})`,
            value: emp.handle,
          })),
        );
        setExistingEmployeeCodes(
          new Set(
            rows
              .map((emp) => (emp.employeeCode || '').trim().toUpperCase())
              .filter((c): c is string => !!c),
          ),
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

  const handleCompanyChange = (value: string, label: string) => {
    setSelectedCompany(value);
    setSelectedCompanyName(label);
    setSelectedBU(undefined);
    setSelectedBUName(undefined);
    setSelectedDepartmentName(undefined);
    updateOnboardingDraft({
      organizationHandle: value,
      organizationName: label,
      businessUnits: [],
      department: '',
    });
  };

  const handleBUChange = (value: string, label: string) => {
    setSelectedBU(value);
    setSelectedBUName(label);
    setSelectedDepartmentName(undefined);
    updateOnboardingDraft({
      businessUnits: [label],
      department: '',
    });
  };

  const handleDepartmentChange = (value: string, label: string) => {
    setSelectedDepartmentName(label);
    updateOnboardingDraft({
      department: label,
    });
  };

  const isLastStep = currentStep === 3;

  const handleNext = async () => {
    // Step 0 → 1: enforce duplicate Employee Code + email uniqueness
    // before letting the user move on. Both checks block hard — a
    // network failure on the email check used to "warn and proceed",
    // but that loophole let duplicates slip through whenever the API
    // hiccuped, so it now blocks too.
    if (currentStep === 0) {
      const code = (draft.employeeCode || '').trim().toUpperCase();
      if (code && existingEmployeeCodes.has(code)) {
        message.error(`Employee Code "${code}" is already in use within this organization.`);
        return;
      }

      if (draft.workEmail) {
        setCheckingEmail(true);
        try {
          const organizationId = getOrganizationId();
          const result = await HrmEmployeeService.checkEmailAvailability(
            organizationId,
            draft.workEmail,
          );
          if (!result.available) {
            message.error('This email is already registered. Please use a different email.');
            return;
          }
        } catch (error) {
          console.error('Email check failed:', error);
          message.error(
            'Could not verify email availability — please retry. Duplicate emails are not allowed within an organization.',
          );
          return;
        } finally {
          setCheckingEmail(false);
        }
      }
    }

    setOnboardingStep(currentStep + 1);
  };

  const handleSubmitWithKeycloak = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Final guard before /create — re-check Employee Code uniqueness
      // and Work Email availability against the org. The Step-0→1 hop
      // already ran these, but the user could have circled back via
      // Previous, edited, then jumped to Submit without revalidating.
      const code = (draft.employeeCode || '').trim().toUpperCase();
      if (code && existingEmployeeCodes.has(code)) {
        message.error(`Employee Code "${code}" is already in use within this organization.`);
        return;
      }
      if (draft.workEmail) {
        try {
          const organizationId = getOrganizationId();
          const result = await HrmEmployeeService.checkEmailAvailability(
            organizationId,
            draft.workEmail,
          );
          if (!result.available) {
            message.error('This email is already registered. Please use a different email.');
            return;
          }
        } catch (error) {
          console.error('Pre-submit email check failed:', error);
          message.error(
            'Could not verify email availability — please retry. Duplicate emails are not allowed within an organization.',
          );
          return;
        }
      }

      // Step 1: Create Keycloak user if requested
      if (keycloakSettings.createKeycloakUser) {
        const username = keycloakSettings.username || draft.workEmail || '';
        const password = keycloakSettings.temporaryPassword || EmployeeKeycloakService.generateTemporaryPassword();

        const keycloakResult = await EmployeeKeycloakService.createUserForEmployee({
          workEmail: username,
          firstName: draft.firstName || '',
          lastName: draft.lastName || '',
          password: password,
        });

        if (!keycloakResult.succes) {
          // Check if user already exists. Use Modal.confirm with explicit
          // button labels — the previous window.confirm wording ("Do you
          // want to continue creating the employee without creating a new
          // Keycloak user?") was easy to misread, leaving HR unsure
          // whether Cancel aborted the whole flow or just the Keycloak
          // step. Modal.confirm with okText: 'Create employee anyway' /
          // cancelText: 'Cancel — do not create' makes the choice
          // unambiguous.
          if (keycloakResult.error?.includes('User exists')) {
            const proceed = await new Promise<boolean>((resolve) => {
              Modal.confirm({
                title: 'Keycloak user already exists for this email',
                content:
                  'A login already exists in Keycloak for this email. ' +
                  'The new employee will reuse that login (no new credentials will be created). ' +
                  'Do you want to continue and create the employee anyway?',
                okText: 'Create employee anyway',
                cancelText: 'Cancel — do not create',
                okButtonProps: { danger: true },
                onOk: () => resolve(true),
                onCancel: () => resolve(false),
              });
            });
            if (!proceed) {
              return;
            }
          } else {
            throw new Error(keycloakResult.error || 'Failed to create Keycloak user');
          }
        } else {
          // Store credentials to display after successful employee creation
          setGeneratedCredentials({
            username: username,
            password: password,
          });
        }
      }

      // Step 2: Create employee
      const created = await submitOnboarding();
      const newEmployeeHandle = created?.handle;

      // Step 2a: Persist joiningDate via /update-official.
      // Backend's /employee/create currently drops joiningDate from the
      // payload (the field reaches the server but isn't saved on the
      // officialDetails record), so the profile reads back blank. The
      // update-official endpoint does honour it — re-applying it here
      // forces the save without requiring the user to edit afterwards.
      if (newEmployeeHandle && draft.joiningDate) {
        try {
          const organizationId = getOrganizationId();
          const cookies = parseCookies();
          await HrmEmployeeService.updateOfficialDetails({
            organizationId,
            handle: newEmployeeHandle,
            firstName: draft.firstName || '',
            lastName: draft.lastName || '',
            title: draft.title || '',
            department: draft.department || '',
            role: draft.role || draft.designation || 'EMPLOYEE',
            businessUnits: draft.businessUnits || [],
            location: draft.location,
            reportingManager: draft.reportingManager,
            reportingManagerName: draft.reportingManagerName,
            joiningDate: draft.joiningDate,
            modifiedBy: cookies.username || 'system',
          });
        } catch (err) {
          console.warn('Failed to persist joiningDate via update-official:', err);
          message.warning(
            'Employee created, but joining date could not be saved automatically — please edit the profile to set it.'
          );
        }
      }

      // Step 2b: Initialize leave balances for the new employee.
      // /leave-balance/initialize indexes by employeeCode (the
      // human-readable id like "EMP0012"), and the leave management UI
      // reads balances using the composite "EMP0012 - John Doe" id —
      // never the UUID handle. Passing the handle here would store the
      // row under a key the leave UI never queries, so the new employee
      // appears with no balances even though the API call succeeded.
      // See useEmployeeIdentity.ts contract for the employeeCode rule.
      if (newEmployeeHandle) {
        const leaveEmployeeId =
          created?.employeeCode && created?.fullName
            ? `${created.employeeCode} - ${created.fullName}`
            : created?.employeeCode || newEmployeeHandle;
        try {
          const organizationId = getOrganizationId();
          await HrmLeaveService.initializeBalances({
            organizationId,
            employeeId: leaveEmployeeId,
            joiningDate: draft.joiningDate || dayjs().format('YYYY-MM-DD'),
          });
          message.success(`Leave balances initialized for ${dayjs(draft.joiningDate || undefined).year()}`);
        } catch {
          message.warning(
            'Employee created. Leave balances could not be initialized automatically — HR can adjust manually.'
          );
        }
      }

      // Step 3: Show credentials if created
      if (generatedCredentials) {
        Modal.success({
          title: 'Employee Created Successfully',
          content: (
            <div>
              <p>Login credentials have been created:</p>
              <p><strong>Username:</strong> {generatedCredentials.username}</p>
              <p><strong>Temporary Password:</strong> {generatedCredentials.password}</p>
              <p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                {keycloakSettings.sendCredentialsEmail 
                  ? 'Credentials have been sent via email.' 
                  : 'Please share these credentials with the employee securely.'}
              </p>
            </div>
          ),
          width: 500,
        });
        setGeneratedCredentials(null);
      }

      // Reset Keycloak settings
      setKeycloakSettings({
        createKeycloakUser: false,
        username: '',
        temporaryPassword: '',
        sendCredentialsEmail: true,
      });

    } catch (error: any) {
      message.error(error.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
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
            companies={companies}
            departments={departments}
            businessUnits={businessUnits}
            employees={employees}
            loadingOptions={loadingOptions}
            selectedCompany={selectedCompany}
            selectedBU={selectedBU}
            onCompanyChange={handleCompanyChange}
            onBUChange={handleBUChange}
            onDepartmentChange={handleDepartmentChange}
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
      width={900}
      destroyOnHidden
      maskClosable={false}
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
          <Can key="submit" I="add">
            <Button
              type="primary"
              loading={isSaving || isSubmitting}
              disabled={isSaving || isSubmitting}
              onClick={handleSubmitWithKeycloak}
            >
              Submit
            </Button>
          </Can>
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
