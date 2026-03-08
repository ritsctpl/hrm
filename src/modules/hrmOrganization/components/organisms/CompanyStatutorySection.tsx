'use client';

import React, { useCallback } from 'react';
import { Input } from 'antd';
import OrgFormField from '../molecules/OrgFormField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
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
  { key: 'gstin', label: 'GSTIN', placeholder: 'Enter GSTIN' },
  { key: 'pfEstablishmentCode', label: 'PF Establishment Code', placeholder: 'Enter PF establishment code' },
  { key: 'esicCode', label: 'ESIC Code', placeholder: 'Enter ESIC code' },
  { key: 'msmeUdyam', label: 'MSME / Udyam No.', placeholder: 'Enter MSME / Udyam registration number' },
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
      setCompanyDraft({ [field]: value });
    },
    [setCompanyDraft]
  );

  return (
    <div className={formStyles.statutoryGrid}>
      {STATUTORY_FIELDS.map((field) => (
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
      ))}
    </div>
  );
};

export default CompanyStatutorySection;
