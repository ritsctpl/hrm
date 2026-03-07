'use client';

import React, { useCallback } from 'react';
import { Input } from 'antd';
import OrgFormField from '../molecules/OrgFormField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { CompanyContactSectionProps } from '../../types/ui.types';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const CompanyContactSection: React.FC<CompanyContactSectionProps> = ({
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
    <div className={formStyles.contactGrid}>
      <OrgFormField label="Official Email" required error={errors.officialEmail}>
        <Input
          value={draft?.officialEmail || ''}
          onChange={(e) => handleChange('officialEmail', e.target.value)}
          placeholder="e.g., info@company.com"
          type="email"
          disabled={disabled}
        />
      </OrgFormField>

      <OrgFormField label="Official Phone" required error={errors.officialPhone}>
        <Input
          value={draft?.officialPhone || ''}
          onChange={(e) => handleChange('officialPhone', e.target.value)}
          placeholder="e.g., +91-9876543210"
          disabled={disabled}
        />
      </OrgFormField>
    </div>
  );
};

export default CompanyContactSection;
