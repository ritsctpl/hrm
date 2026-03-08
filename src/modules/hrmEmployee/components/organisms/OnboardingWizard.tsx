/**
 * OnboardingWizard - 4-step Ant Design Steps modal for creating a new employee
 */

'use client';

import React from 'react';
import { Modal, Steps, Button, Input, Select, DatePicker, Form, Divider } from 'antd';
import { useOnboardingWizard } from '../../hooks/useHrmEmployeeData';
import { ONBOARDING_STEPS } from '../../utils/constants';
import type { CreateEmployeeRequest } from '../../types/api.types';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

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
}> = ({ draft, errors, onChange }) => (
  <div className={formStyles.wizardStepBody}>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Title</label>
        <Input
          value={draft.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Mr. / Ms. / Dr."
        />
      </div>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Department
        </label>
        <Input
          value={draft.department || ''}
          onChange={(e) => onChange({ department: e.target.value })}
          status={errors.department ? 'error' : undefined}
          placeholder="Engineering"
        />
        {errors.department && (
          <div className={formStyles.formFieldError}>{errors.department}</div>
        )}
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={`${formStyles.formFieldLabel} ${formStyles.formFieldRequired}`}>
          Designation
        </label>
        <Input
          value={draft.designation || ''}
          onChange={(e) => onChange({ designation: e.target.value })}
          status={errors.designation ? 'error' : undefined}
          placeholder="Software Engineer"
        />
        {errors.designation && (
          <div className={formStyles.formFieldError}>{errors.designation}</div>
        )}
      </div>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Reporting Manager</label>
        <Input
          value={draft.reportingManager || ''}
          onChange={(e) => onChange({ reportingManager: e.target.value })}
          placeholder="Employee code or name"
        />
      </div>
    </div>
    <div className={formStyles.formRow}>
      <div className={formStyles.formField}>
        <label className={formStyles.formFieldLabel}>Business Units</label>
        <Select
          mode="tags"
          value={draft.businessUnits || []}
          onChange={(val) => onChange({ businessUnits: val })}
          placeholder="Type and press enter"
          style={{ width: '100%' }}
        />
      </div>
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
        <span className={formStyles.reviewLabel}>Designation</span>
        <span className={formStyles.reviewValue}>{draft.designation || '--'}</span>
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

  const isLastStep = currentStep === 3;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicStep draft={draft} errors={errors} onChange={updateOnboardingDraft} />;
      case 1:
        return <OfficialStep draft={draft} errors={errors} onChange={updateOnboardingDraft} />;
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
      destroyOnClose
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
            onClick={() => setOnboardingStep(currentStep + 1)}
          >
            Next
          </Button>
        ),
        isLastStep && (
          <Button
            key="submit"
            type="primary"
            loading={isSaving}
            onClick={submitOnboarding}
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
