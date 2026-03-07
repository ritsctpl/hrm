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

  const handleRegisteredChange = useCallback(
    (field: string, value: string) => {
      const currentAddress = draft?.registeredAddress || { ...EMPTY_ADDRESS };
      setCompanyDraft({
        registeredAddress: { ...currentAddress, [field]: value } as Address,
      });
    },
    [draft?.registeredAddress, setCompanyDraft]
  );

  const handleCorporateChange = useCallback(
    (field: string, value: string) => {
      const currentAddress = draft?.corporateAddress || { ...EMPTY_ADDRESS };
      setCompanyDraft({
        corporateAddress: { ...currentAddress, [field]: value } as Address,
      });
    },
    [draft?.corporateAddress, setCompanyDraft]
  );

  const handleSameAsRegistered = useCallback(
    (checked: boolean) => {
      if (checked && draft?.registeredAddress) {
        setCompanyDraft({
          corporateAddress: { ...draft.registeredAddress },
        });
      } else {
        setCompanyDraft({
          corporateAddress: { ...EMPTY_ADDRESS } as Address,
        });
      }
    },
    [draft?.registeredAddress, setCompanyDraft]
  );

  return (
    <div>
      {/* Registered Address */}
      <div className={mainStyles.addressBlock}>
        <div className={mainStyles.addressBlockTitle}>Registered Address</div>
        <OrgAddressFields
          prefix="registeredAddress"
          address={draft?.registeredAddress || {}}
          onChange={handleRegisteredChange}
          errors={errors}
          disabled={disabled}
        />
      </div>

      {/* Corporate Address */}
      <div className={mainStyles.addressBlock} style={{ marginTop: 16 }}>
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
          address={draft?.corporateAddress || {}}
          onChange={handleCorporateChange}
          errors={errors}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default CompanyAddressSection;
