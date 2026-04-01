'use client';

import React, { useCallback } from 'react';
import { Input } from 'antd';
import OrgFormField from '../molecules/OrgFormField';
import OrgViewField from '../molecules/OrgViewField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { validatePAN, validateTAN, validateCIN, validateGSTIN } from '../../utils/validations';
import type { CompanyStatutorySectionProps } from '../../types/ui.types';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const STATUTORY_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  placeholder: string;
  maxLength?: number;
}> = [
  { key: 'pan', label: 'PAN', placeholder: 'e.g., ABCDE1234F', maxLength: 10 },
  { key: 'tan', label: 'TAN', placeholder: 'e.g., ABCD12345E', maxLength: 10 },
  { key: 'cin', label: 'CIN', placeholder: 'e.g., U12345MH2000PTC123456', maxLength: 21 },
  { key: 'gstIn', label: 'GSTIN', placeholder: 'e.g., 27AAPFU0939F1ZV', maxLength: 15 },
  { key: 'pfEstablishmentCode', label: 'PF Establishment Code', placeholder: 'Enter PF establishment code' },
  { key: 'esicCode', label: 'ESIC Code', placeholder: 'Enter ESIC code' },
  // { key: 'msmeUdyam', label: 'MSME / Udyam No.', placeholder: 'Enter MSME / Udyam registration number' },
  { key: 'registrationNumber', label: 'Registration No.', placeholder: 'Enter company registration number' },
];

const CompanyStatutorySection: React.FC<CompanyStatutorySectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, setCompanyDraft } = useHrmOrganizationStore();
  const draft = companyProfile.draft;
  const errors = companyProfile.errors;

  const handleChange = useCallback(
    (field: string, value: string) => {
      // Convert to uppercase for specific fields
      let processedValue = value;
      if (field === 'pan' || field === 'tan' || field === 'cin' || field === 'gstIn') {
        processedValue = value.toUpperCase();
      }
      
      setCompanyDraft({ [field]: processedValue });
      
      // Real-time validation for specific fields - only if value exists
      let error: string | null = null;
      if (field === 'pan' && processedValue?.trim()) {
        error = validatePAN(processedValue) || null;
        // Also re-validate GSTIN if it exists, to check PAN match
        if (draft?.gstIn && draft.gstIn.trim()) {
          const gstinError = validateGSTIN(draft.gstIn, processedValue);
          if (gstinError) {
            // GSTIN error will be shown when user edits GSTIN field
          }
        }
      } else if (field === 'tan' && processedValue?.trim()) {
        error = validateTAN(processedValue) || null;
      } else if (field === 'cin' && processedValue?.trim()) {
        error = validateCIN(processedValue) || null;
      } else if (field === 'gstIn' && processedValue?.trim()) {
        // Pass PAN for cross-validation
        error = validateGSTIN(processedValue, draft?.pan) || null;
      }
      
      // Update error in store if validation failed
      if (error) {
        // Note: You might want to add a setCompanyFieldError action to the store
        // For now, errors will be shown on save attempt
      }
    },
    [setCompanyDraft, draft]
  );

  return (
    <div className={formStyles.statutoryGrid}>
      {STATUTORY_FIELDS.map((field) => (
        disabled ? (
          <OrgViewField
            key={field.key}
            label={field.label}
            value={(draft?.[field.key as keyof typeof draft] as string) || ''}
          />
        ) : (
          <OrgFormField
            key={field.key}
            label={field.label}
            error={errors[field.key]}
          >
            <Input
              value={(draft?.[field.key as keyof typeof draft] as string) || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              disabled={disabled}
            />
          </OrgFormField>
        )
      ))}
    </div>
  );
};

export default CompanyStatutorySection;
