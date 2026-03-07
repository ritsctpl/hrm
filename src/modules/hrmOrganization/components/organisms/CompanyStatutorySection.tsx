'use client';

import React, { useCallback } from 'react';
import { Input } from 'antd';
import OrgFormField from '../molecules/OrgFormField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { CompanyStatutorySectionProps } from '../../types/ui.types';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const STATUTORY_FIELDS = [
  { key: 'pan', label: 'PAN', placeholder: 'e.g., ABCDE1234F', maxLength: 10 },
  { key: 'tan', label: 'TAN', placeholder: 'e.g., ABCD12345E', maxLength: 10 },
  { key: 'cin', label: 'CIN', placeholder: 'e.g., U12345MH2000PTC123456', maxLength: 21 },
  { key: 'pfRegistrationNo', label: 'PF Registration No.', placeholder: 'Enter PF registration number' },
  { key: 'esiRegistrationNo', label: 'ESI Registration No.', placeholder: 'Enter ESI registration number' },
  { key: 'msmeRegistrationNo', label: 'MSME Registration No.', placeholder: 'Enter MSME registration number' },
  { key: 'ptRegistrationNo', label: 'PT Registration No.', placeholder: 'Enter PT registration number' },
  { key: 'lwfRegistrationNo', label: 'LWF Registration No.', placeholder: 'Enter LWF registration number' },
] as const;

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
