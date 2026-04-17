'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Select, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import OrgViewField from '../molecules/OrgViewField';
import Can from '../../../hrmAccess/components/Can';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { HrmOrganizationService } from '../../services/hrmOrganizationService';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
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

const CompanyFinancialYearSection: React.FC<CompanyFinancialYearSectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, fetchCompanyProfile, setCompanyDraft } = useHrmOrganizationStore();
  const data = companyProfile.data;
  const draft = companyProfile.draft;

  const draftRecord = draft as unknown as Record<string, unknown> | null;
  const dataRecord = data as unknown as Record<string, unknown> | null;
  
  // Get current values from draft or data
  const currentStartMonth = (draftRecord?.financialYearStartMonth as string) || (dataRecord?.financialYearStartMonth as string) || 'April';
  const currentEndMonth = (draftRecord?.financialYearEndMonth as string) || (dataRecord?.financialYearEndMonth as string) || 'March';
  
  const [startMonth, setStartMonth] = useState<string>(currentStartMonth);
  const [endMonth, setEndMonth] = useState<string>(currentEndMonth);
  const [saving, setSaving] = useState(false);

  // Sync initial values to draft on mount
  useEffect(() => {
    if (!draftRecord?.financialYearStartMonth) {
      setCompanyDraft({
        financialYearStartMonth: currentStartMonth,
        financialYearEndMonth: currentEndMonth,
      });
    }
  }, []);

  // Sync to draft when values change
  const handleStartMonthChange = useCallback((value: string) => {
    setStartMonth(value);
    setCompanyDraft({ financialYearStartMonth: value });
  }, [setCompanyDraft]);

  const handleEndMonthChange = useCallback((value: string) => {
    setEndMonth(value);
    setCompanyDraft({ financialYearEndMonth: value });
  }, [setCompanyDraft]);

  const handleSave = useCallback(async () => {
    if (!data?.handle) {
      message.info('Financial year will be saved with the company');
      return;
    }
    const cookies = parseCookies();
    const organizationId = getOrganizationId();
    const userId = cookies.rl_user_id || cookies.userId || 'system';

    setSaving(true);
    try {
      await HrmOrganizationService.updateFinancialYear({ organizationId,
        handle: data.handle,
        financialYearStartMonth: startMonth,
        financialYearEndMonth: endMonth,
        modifiedBy: userId,
      });
      message.success('Financial year updated successfully');
      await fetchCompanyProfile();
    } catch {
      message.error('Failed to update financial year');
    } finally {
      setSaving(false);
    }
  }, [data?.handle, startMonth, endMonth, fetchCompanyProfile]);

  const isCreating = !data?.handle;
  const isEditing = companyProfile.isEditing;

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

          <div>
            <Can I={isCreating ? 'add' : 'edit'}>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                disabled={isCreating}
                title={isCreating ? 'Financial year will be saved with the company' : 'Update Financial Year'}
              >
                {isCreating ? 'Financial Year (will save with company)' : 'Update Financial Year'}
              </Button>
            </Can>
          </div>
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
