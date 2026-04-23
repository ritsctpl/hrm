'use client';

import React, { useCallback } from 'react';
import { Checkbox } from 'antd';
import OrgAddressFields from '../molecules/OrgAddressFields';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { EMPTY_ADDRESS } from '../../utils/constants';
import type { CompanyAddressSectionProps } from '../../types/ui.types';
import type { Address, CompanyProfile } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const CompanyAddressSection: React.FC<CompanyAddressSectionProps> = ({
  disabled = false,
}) => {
  const { companyProfile, setCompanyDraft, setSameAsRegisteredOffice } = useHrmOrganizationStore();
  const draft = companyProfile.draft;
  const errors = companyProfile.errors;
  const sameAsRegistered = companyProfile.sameAsRegisteredOffice;

  const registeredAddr = draft?.registeredOfficeAddress || draft?.registeredAddress;
  const corporateAddr = draft?.corporateOfficeAddress || draft?.corporateAddress;

  // When flag is on, any edit to registered propagates to corporate so the
  // two addresses stay in sync live (not just a one-time copy on check).
  const handleRegisteredChange = useCallback(
    (field: string, value: string) => {
      const currentAddress = registeredAddr || { ...EMPTY_ADDRESS };
      const next = { ...currentAddress, [field]: value } as Address;
      const patch: Partial<CompanyProfile> = {
        registeredOfficeAddress: next,
        registeredAddress: next,
      };
      if (sameAsRegistered) {
        patch.corporateOfficeAddress = { ...next };
        patch.corporateAddress = { ...next };
      }
      setCompanyDraft(patch);
    },
    [registeredAddr, setCompanyDraft, sameAsRegistered]
  );

  // Atomic multi-field patch — used by OrgAddressFields when multiple fields
  // must land in the same draft update (post-verification stamps). Sequential
  // single-field updates suffer from stale-closure overwrites.
  const handleRegisteredChangeBulk = useCallback(
    (patch: Record<string, string>) => {
      const currentAddress = registeredAddr || { ...EMPTY_ADDRESS };
      const next = { ...currentAddress, ...patch } as Address;
      const draftPatch: Partial<CompanyProfile> = {
        registeredOfficeAddress: next,
        registeredAddress: next,
      };
      if (sameAsRegistered) {
        draftPatch.corporateOfficeAddress = { ...next };
        draftPatch.corporateAddress = { ...next };
      }
      setCompanyDraft(draftPatch);
    },
    [registeredAddr, setCompanyDraft, sameAsRegistered]
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

  const handleCorporateChangeBulk = useCallback(
    (patch: Record<string, string>) => {
      const currentAddress = corporateAddr || { ...EMPTY_ADDRESS };
      const next = { ...currentAddress, ...patch } as Address;
      setCompanyDraft({
        corporateOfficeAddress: next,
        corporateAddress: next,
      });
    },
    [corporateAddr, setCompanyDraft]
  );

  // Checking copies registered → corporate once and engages live-sync.
  // Unchecking preserves the (now-synced) corporate values so the user can
  // diverge from that starting point instead of starting from empty.
  const handleSameAsRegistered = useCallback(
    (checked: boolean) => {
      setSameAsRegisteredOffice(checked);
      if (checked && registeredAddr) {
        setCompanyDraft({
          corporateOfficeAddress: { ...registeredAddr },
          corporateAddress: { ...registeredAddr },
        });
      }
    },
    [registeredAddr, setCompanyDraft, setSameAsRegisteredOffice]
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {/* Registered Address */}
      <div className={mainStyles.addressBlock}>
        <div className={mainStyles.addressBlockTitle}>Registered Address</div>
        <OrgAddressFields
          prefix="registeredOfficeAddress"
          address={registeredAddr || {}}
          onChange={handleRegisteredChange}
          onChangeBulk={handleRegisteredChangeBulk}
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
              checked={sameAsRegistered}
              onChange={(e) => handleSameAsRegistered(e.target.checked)}
              style={{ marginLeft: 16, fontWeight: 'normal', fontSize: 13 }}
            >
              Same as registered address
            </Checkbox>
          )}
        </div>
        <OrgAddressFields
          prefix="corporateOfficeAddress"
          address={corporateAddr || {}}
          onChange={handleCorporateChange}
          onChangeBulk={handleCorporateChangeBulk}
          errors={errors}
          disabled={disabled || sameAsRegistered}
        />
      </div>
    </div>
  );
};

export default CompanyAddressSection;
