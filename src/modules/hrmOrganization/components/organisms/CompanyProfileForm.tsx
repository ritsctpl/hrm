'use client';

import React, { useCallback } from 'react';
import { Tabs, Button, Spin, message } from 'antd';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CompanyIdentitySection from './CompanyIdentitySection';
import CompanyStatutorySection from './CompanyStatutorySection';
import CompanyBankSection from './CompanyBankSection';
import CompanyAddressSection from './CompanyAddressSection';
import CompanyContactSection from './CompanyContactSection';
import OrgSaveButton from '../atoms/OrgSaveButton';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { COMPANY_TAB_LABELS } from '../../utils/constants';
import type { CompanyTabKey } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const CompanyProfileForm: React.FC = () => {
  const {
    companyProfile,
    setCompanyActiveTab,
    setCompanyEditing,
    saveCompanyProfile,
  } = useHrmOrganizationStore();

  const { isLoading, isSaving, isEditing, activeTab, data, errors } = companyProfile;

  const handleTabChange = useCallback(
    (key: string) => {
      setCompanyActiveTab(key as CompanyTabKey);
    },
    [setCompanyActiveTab]
  );

  const handleEdit = useCallback(() => {
    setCompanyEditing(true);
  }, [setCompanyEditing]);

  const handleCancel = useCallback(() => {
    setCompanyEditing(false);
  }, [setCompanyEditing]);

  const handleSave = useCallback(async () => {
    try {
      await saveCompanyProfile();
      message.success('Company profile saved successfully');
    } catch {
      message.error('Failed to save company profile');
    }
  }, [saveCompanyProfile]);

  if (isLoading) {
    return (
      <div className={mainStyles.loadingContainer}>
        <Spin size="large" tip="Loading company profile..." />
      </div>
    );
  }

  const isDisabled = !isEditing;

  const tabItems = [
    {
      key: 'identity',
      label: COMPANY_TAB_LABELS.identity,
      children: <CompanyIdentitySection disabled={isDisabled} />,
    },
    {
      key: 'statutory',
      label: COMPANY_TAB_LABELS.statutory,
      children: <CompanyStatutorySection disabled={isDisabled} />,
    },
    {
      key: 'bank',
      label: COMPANY_TAB_LABELS.bank,
      children: <CompanyBankSection disabled={isDisabled} />,
    },
    {
      key: 'address',
      label: COMPANY_TAB_LABELS.address,
      children: <CompanyAddressSection disabled={isDisabled} />,
    },
    {
      key: 'contact',
      label: COMPANY_TAB_LABELS.contact,
      children: <CompanyContactSection disabled={isDisabled} />,
    },
  ];

  return (
    <div className={mainStyles.companyProfileContainer}>
      <div className={mainStyles.companyTabs}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="small"
        />

        {errors._general && (
          <div style={{ color: '#ff4d4f', marginTop: 8 }}>{errors._general}</div>
        )}

        <div className={mainStyles.companyActions}>
          {!isEditing && data && (
            <Button
              icon={<EditIcon fontSize="small" />}
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          {isEditing && data && (
            <Button
              icon={<CancelIcon fontSize="small" />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          )}
          {isEditing && (
            <OrgSaveButton
              loading={isSaving}
              onClick={handleSave}
              label={data ? 'Update' : 'Create'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileForm;
