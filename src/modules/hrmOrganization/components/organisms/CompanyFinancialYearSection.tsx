'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Select } from 'antd';
import OrgFormField from '../molecules/OrgFormField';
import OrgViewField from '../molecules/OrgViewField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { CompanyFinancialYearSectionProps } from '../../types/ui.types';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const MONTHS = [
  { label: 'January', value: 'January' },
  { label: 'February', value: 'February' },
  { label: 'March', value: 'March' },
  { label: 'April', value: 'April' },
  { label: 'May', value: 'May' },
  { label: 'June', value: 'June' },
  { label: 'July', value: 'July' },
  { label: 'August', value: 'August' },
  { label: 'September', value: 'September' },
  { label: 'October', value: 'October' },
  { label: 'November', value: 'November' },
  { label: 'December', value: 'December' },
];

const MONTH_NAMES = MONTHS.map((m) => m.value);

const CompanyFinancialYearSection: React.FC<CompanyFinancialYearSectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, setCompanyDraft } = useHrmOrganizationStore();
  const data = companyProfile.data;
  const draft = companyProfile.draft;

  const draftRecord = draft as unknown as Record<string, unknown> | null;
  const dataRecord = data as unknown as Record<string, unknown> | null;

  const currentStartMonth = (draftRecord?.financialYearStartMonth as string) || (dataRecord?.financialYearStartMonth as string) || 'April';
  const currentEndMonth = (draftRecord?.financialYearEndMonth as string) || (dataRecord?.financialYearEndMonth as string) || 'March';

  const [startMonth, setStartMonth] = useState<string>(currentStartMonth);
  const [endMonth, setEndMonth] = useState<string>(currentEndMonth);

  // Seed defaults into the draft on first mount so the main Save has a value
  // even when the user never touches the dropdowns. Seed each field
  // independently — for an existing company being edited, the draft may
  // already carry Start Month from loaded data but not End Month (or vice
  // versa); previous code guarded on Start alone and left End undefined,
  // which tripped validation even when the UI showed a fallback value.
  useEffect(() => {
    const patch: { financialYearStartMonth?: string; financialYearEndMonth?: string } = {};
    if (!draftRecord?.financialYearStartMonth) {
      patch.financialYearStartMonth = currentStartMonth;
    }
    if (!draftRecord?.financialYearEndMonth) {
      patch.financialYearEndMonth = currentEndMonth;
    }
    if (Object.keys(patch).length > 0) {
      setCompanyDraft(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changing the start month auto-sets the end month to start-1 (12-month FY).
  // User can still override end month; validation will catch bad overrides.
  const handleStartMonthChange = useCallback((value: string) => {
    const idx = MONTH_NAMES.indexOf(value);
    const nextEnd = MONTH_NAMES[(idx + 11) % 12];
    setStartMonth(value);
    setEndMonth(nextEnd);
    setCompanyDraft({ financialYearStartMonth: value, financialYearEndMonth: nextEnd });
  }, [setCompanyDraft]);

  const handleEndMonthChange = useCallback((value: string) => {
    setEndMonth(value);
    setCompanyDraft({ financialYearEndMonth: value });
  }, [setCompanyDraft]);

  return (
    <div className={formStyles.contactGrid}>
      {!disabled ? (
        <>
          <OrgFormField label="Start Month" required>
            <Select
              value={startMonth}
              onChange={handleStartMonthChange}
              options={MONTHS}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </OrgFormField>

          <OrgFormField label="End Month" required>
            <Select
              value={endMonth}
              onChange={handleEndMonthChange}
              options={MONTHS}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </OrgFormField>
        </>
      ) : (
        <>
          <OrgViewField label="Start Month" required value={startMonth} />
          <OrgViewField label="End Month" required value={endMonth} />
        </>
      )}
    </div>
  );
};

export default CompanyFinancialYearSection;
