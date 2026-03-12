'use client';

import React, { useCallback } from 'react';
import { Checkbox } from 'antd';
import OrgAddressFields from '../molecules/OrgAddressFields';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { EMPTY_ADDRESS } from '../../utils/constants';
import type { CompanyAddressSectionProps } from '../../types/ui.types';
import type { Address } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const CompanyAddressSection: React.FC<CompanyAddressSectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, setCompanyDraft } = useHrmOrganizationStore();
  const draft = companyProfile.draft;
  const errors = companyProfile.errors;

  const registeredAddr = draft?.registeredOfficeAddress || draft?.registeredAddress;
  const corporateAddr = draft?.corporateOfficeAddress || draft?.corporateAddress;

  const handleRegisteredChange = useCallback(
    (field: string, value: string) => {
      const currentAddress = registeredAddr || { ...EMPTY_ADDRESS };
      setCompanyDraft({
        registeredOfficeAddress: { ...currentAddress, [field]: value } as Address,
        registeredAddress: { ...currentAddress, [field]: value } as Address,
      });
    },
    [registeredAddr, setCompanyDraft]
  );

  const handleCorporateChange = useCallback(
    (field: string, value: string) => {
      const currentAddress = corporateAddr || { ...EMPTY_ADDRESS };
      setCompanyDraft({
        corporateOfficeAddress: { ...currentAddress, [field]: value } as Address,
        corporateAddress: { ...currentAddress, [field]: value } as Address,
      });
    },
    [corporateAddr, setCompanyDraft]
  );

  const handleSameAsRegistered = useCallback(
    (checked: boolean) => {
      if (checked && registeredAddr) {
        setCompanyDraft({
          corporateOfficeAddress: { ...registeredAddr },
          corporateAddress: { ...registeredAddr },
        });
      } else {
        setCompanyDraft({
          corporateOfficeAddress: { ...EMPTY_ADDRESS } as Address,
          corporateAddress: { ...EMPTY_ADDRESS } as Address,
        });
      }
    },
    [registeredAddr, setCompanyDraft]
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {/* Registered Address */}
      <div className={mainStyles.addressBlock}>
        <div className={mainStyles.addressBlockTitle}>Registered Address</div>
        <OrgAddressFields
          prefix="registeredAddress"
          address={registeredAddr || {}}
          onChange={handleRegisteredChange}
          errors={errors}
          disabled={disabled}
        />
      </div>

      {/* Corporate Address */}
      <div className={mainStyles.addressBlock}>
        <div className={mainStyles.addressBlockTitle}>
          Corporate Address
          {!disabled && (
            <Checkbox
              onChange={(e) => handleSameAsRegistered(e.target.checked)}
              style={{ marginLeft: 16, fontWeight: 'normal', fontSize: 13 }}
            >
              Same as registered address
            </Checkbox>
          )}
        </div>
        <OrgAddressFields
          prefix="corporateAddress"
          address={corporateAddr || {}}
          onChange={handleCorporateChange}
          errors={errors}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default CompanyAddressSection;
