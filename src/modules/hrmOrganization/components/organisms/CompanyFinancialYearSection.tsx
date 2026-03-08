'use client';

import React, { useCallback, useState } from 'react';
import { Select, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { HrmOrganizationService } from '../../services/hrmOrganizationService';
import { parseCookies } from 'nookies';
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

const CompanyFinancialYearSection: React.FC = () => {
  const { companyProfile, fetchCompanyProfile } = useHrmOrganizationStore();
  const data = companyProfile.data;

  const dataRecord = data as unknown as Record<string, unknown> | null;
  const [startMonth, setStartMonth] = useState<string>(
    (dataRecord?.financialYearStartMonth as string) || 'April'
  );
  const [endMonth, setEndMonth] = useState<string>(
    (dataRecord?.financialYearEndMonth as string) || 'March'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!data?.handle) return;
    const cookies = parseCookies();
    const site = cookies.site || '';
    const userId = cookies.rl_user_id || cookies.userId || 'system';

    setSaving(true);
    try {
      await HrmOrganizationService.updateFinancialYear({
        site,
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

  return (
    <div className={formStyles.contactGrid}>
      <OrgFormField label="Start Month" required>
        <Select
          value={startMonth}
          onChange={setStartMonth}
          options={MONTHS}
          style={{ width: '100%' }}
        />
      </OrgFormField>

      <OrgFormField label="End Month" required>
        <Select
          value={endMonth}
          onChange={setEndMonth}
          options={MONTHS}
          style={{ width: '100%' }}
        />
      </OrgFormField>

      <div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          Update Financial Year
        </Button>
      </div>
    </div>
  );
};

export default CompanyFinancialYearSection;
