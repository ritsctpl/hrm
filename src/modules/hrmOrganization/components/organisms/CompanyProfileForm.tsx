'use client';

import React, { useCallback } from 'react';
import { Button, Spin, message } from 'antd';
import { EditOutlined, CloseOutlined } from '@ant-design/icons';
import CompanyIdentitySection from './CompanyIdentitySection';
import CompanyStatutorySection from './CompanyStatutorySection';
import CompanyBankSection from './CompanyBankSection';
import CompanyAddressSection from './CompanyAddressSection';
import CompanyFinancialYearSection from './CompanyFinancialYearSection';
import OrgSaveButton from '../atoms/OrgSaveButton';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import mainStyles from '../../styles/HrmOrganization.module.css';

const CompanyProfileForm: React.FC = () => {
  const {
    companyProfile,
    setCompanyEditing,
    saveCompanyProfile,
  } = useHrmOrganizationStore();
  
  // Get the store's get function to access current state
  const get = useHrmOrganizationStore.getState;

  const { isLoading, isSaving, isEditing, data, errors } = companyProfile;

  const handleEdit = useCallback(() => {
    setCompanyEditing(true);
  }, [setCompanyEditing]);

  const handleCancel = useCallback(() => {
    setCompanyEditing(false);
  }, [setCompanyEditing]);

  const handleSave = useCallback(async () => {
    try {
      await saveCompanyProfile();
      
      // Get the updated state after save completes
      const updatedState = get().companyProfile;
      const errorKeys = Object.keys(updatedState.errors).filter(key => key !== '_general');
      
      if (errorKeys.length > 0) {
        // Show validation errors
        const errorMessages = errorKeys.map(key => `${key}: ${updatedState.errors[key]}`).join('\n');
        message.error(errorMessages);
      } else if (updatedState.errors._general) {
        // Show API error as popup
        message.error(updatedState.errors._general);
      } else {
        // Show success only if no errors
        message.success('Company profile saved successfully');
      }
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

  const isNew = !data;
  const isDisabled = !isEditing && !isNew;

  return (
    <div className={mainStyles.companyProfileContainer}>
      {/* Header with actions */}
      <div className={mainStyles.companyFormHeader}>
        <h2 className={mainStyles.companyFormTitle}>Company Profile</h2>
        <div className={mainStyles.companyFormActions}>
          {!isEditing && data && (
            <Button
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="small"
            >
              Edit
            </Button>
          )}
          {isEditing && data && (
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancel}
              size="small"
            >
              Cancel
            </Button>
          )}
          {(isEditing || isNew) && (
            <OrgSaveButton
              loading={isSaving}
              onClick={handleSave}
              label={data ? 'Update' : 'Create'}
            />
          )}
        </div>
      </div>

      {errors._general && (
        <div style={{ color: '#ff4d4f', marginBottom: 12 }}>{errors._general}</div>
      )}

      {/* Section 1: Identity & Logo */}
      <div className={mainStyles.profileSection}>
        <div className={mainStyles.profileSectionTitle}>Identity</div>
        <CompanyIdentitySection disabled={isDisabled} />
      </div>

      {/* Section 2: Statutory IDs */}
      <div className={mainStyles.profileSection}>
        <div className={mainStyles.profileSectionTitle}>Statutory Details</div>
        <CompanyStatutorySection disabled={isDisabled} />
      </div>

      {/* Section 4: Addresses */}
      <div className={mainStyles.profileSection}>
        <div className={mainStyles.profileSectionTitle}>Addresses</div>
        <CompanyAddressSection disabled={isDisabled} />
      </div>

      {/* Section 5: Bank Accounts */}
      <div className={mainStyles.profileSection}>
        <div className={mainStyles.profileSectionTitle}>Bank Accounts</div>
        <CompanyBankSection disabled={isDisabled} />
      </div>

      {/* Section 6: Financial Year */}
      <div className={mainStyles.profileSection}>
        <div className={mainStyles.profileSectionTitle}>Financial Year</div>
        <CompanyFinancialYearSection />
      </div>

      {/* Bottom actions for long form */}
      {(isEditing || isNew) && (
        <div className={mainStyles.companyActions}>
          {data && (
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancel}
              size="small"
            >
              Cancel
            </Button>
          )}
          <OrgSaveButton
            loading={isSaving}
            onClick={handleSave}
            label={data ? 'Update' : 'Create'}
          />
        </div>
      )}
    </div>
  );
};

export default CompanyProfileForm;
