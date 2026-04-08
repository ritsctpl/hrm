'use client';

import React, { useCallback, useState } from 'react';
import { Input, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import OrgViewField from '../molecules/OrgViewField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { validatePAN, validateTAN, validateCIN, validateGSTIN } from '../../utils/validations';
import type { CompanyStatutorySectionProps } from '../../types/ui.types';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const VALIDATORS: Record<string, (val: string, pan?: string) => string | null> = {
  pan: (v) => validatePAN(v),
  tan: (v) => validateTAN(v),
  cin: (v) => validateCIN(v),
  gstIn: (v, pan) => validateGSTIN(v, pan),
};

const UPPERCASE_FIELDS = new Set(['pan', 'tan', 'cin', 'gstIn']);

const STATUTORY_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  placeholder: string;
  maxLength?: number;
  tooltip?: string;
}> = [
  { key: 'pan', label: 'PAN', placeholder: 'e.g., ABCDE1234F', maxLength: 10, tooltip: 'Permanent Account Number — 5 letters + 4 digits + 1 letter' },
  { key: 'tan', label: 'TAN', placeholder: 'e.g., ABCD12345E', maxLength: 10, tooltip: 'Tax Deduction Account Number — 4 letters + 5 digits + 1 letter' },
  { key: 'cin', label: 'CIN', placeholder: 'e.g., U12345MH2000PTC123456', maxLength: 21, tooltip: 'Corporate Identity Number — 21 character alphanumeric code issued by MCA' },
  { key: 'gstIn', label: 'GSTIN', placeholder: 'e.g., 27AAPFU0939F1ZV', maxLength: 15, tooltip: 'GST Identification Number — 15 characters. Characters 3-12 must match your PAN' },
  { key: 'pfEstablishmentCode', label: 'PF Establishment Code', placeholder: 'Enter PF establishment code', tooltip: 'EPFO establishment code for provident fund' },
  { key: 'esicCode', label: 'ESIC Code', placeholder: 'Enter ESIC code', tooltip: 'Employees State Insurance Corporation code' },
  { key: 'msmeUdyam', label: 'MSME / Udyam No.', placeholder: 'Enter MSME / Udyam registration number', tooltip: 'Udyam registration number issued by MSME ministry' },
  { key: 'registrationNumber', label: 'Registration No.', placeholder: 'Enter company registration number' },
];

const CompanyStatutorySection: React.FC<CompanyStatutorySectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, setCompanyDraft, setCompanyError, clearCompanyErrors } = useHrmOrganizationStore();
  const draft = companyProfile.draft;
  const errors = companyProfile.errors;

  // Track which fields have been validated (touched + blurred)
  const [validated, setValidated] = useState<Record<string, 'valid' | 'invalid'>>({});

  const handleChange = useCallback(
    (field: string, value: string) => {
      const processedValue = UPPERCASE_FIELDS.has(field) ? value.toUpperCase() : value;
      setCompanyDraft({ [field]: processedValue });

      // Clear error and validation status while user is typing
      if (errors[field]) {
        setCompanyError(field, '');
      }
      setValidated((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [setCompanyDraft, errors, setCompanyError]
  );

  const handleBlur = useCallback(
    (field: string) => {
      const value = (draft?.[field as keyof typeof draft] as string) || '';

      // Skip validation if field is empty (will be caught on save for required fields)
      if (!value.trim()) {
        setValidated((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
        setCompanyError(field, '');
        return;
      }

      const validatorFn = VALIDATORS[field];
      if (!validatorFn) {
        // No validator — mark as valid if it has value
        setValidated((prev) => ({ ...prev, [field]: 'valid' }));
        return;
      }

      const error = validatorFn(value, draft?.pan || undefined);

      if (error) {
        setCompanyError(field, error);
        setValidated((prev) => ({ ...prev, [field]: 'invalid' }));
      } else {
        setCompanyError(field, '');
        setValidated((prev) => ({ ...prev, [field]: 'valid' }));
      }

      // Cross-validate: if PAN changed, re-validate GSTIN
      if (field === 'pan' && draft?.gstIn?.trim()) {
        const gstinError = validateGSTIN(draft.gstIn, value);
        if (gstinError) {
          setCompanyError('gstIn', gstinError);
          setValidated((prev) => ({ ...prev, gstIn: 'invalid' }));
        } else {
          setCompanyError('gstIn', '');
          setValidated((prev) => ({ ...prev, gstIn: 'valid' }));
        }
      }
    },
    [draft, setCompanyError]
  );

  const getFieldSuffix = (fieldKey: string) => {
    const status = validated[fieldKey];
    if (!status) return undefined;
    if (status === 'valid') return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />;
    if (status === 'invalid') return <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />;
    return undefined;
  };

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
            label={
              <span>
                {field.label}
                {field.tooltip && (
                  <Tooltip title={field.tooltip}>
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#8c8c8c', fontSize: 12, cursor: 'help' }} />
                  </Tooltip>
                )}
              </span>
            }
            error={errors[field.key]}
          >
            <Input
              value={(draft?.[field.key as keyof typeof draft] as string) || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onBlur={() => handleBlur(field.key)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              disabled={disabled}
              suffix={getFieldSuffix(field.key)}
              status={validated[field.key] === 'invalid' ? 'error' : undefined}
            />
          </OrgFormField>
        )
      ))}
    </div>
  );
};

export default CompanyStatutorySection;
