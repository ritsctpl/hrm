'use client';

import React, { useCallback } from 'react';
import { Input, Button, message } from 'antd';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import OrgViewField from '../molecules/OrgViewField';
import OrgAddressFields from '../molecules/OrgAddressFields';
import OrgSaveButton from '../atoms/OrgSaveButton';
import Can from '../../../hrmAccess/components/Can';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { EMPTY_ADDRESS } from '../../utils/constants';
import { getTaxIdLabel, getCountryValidationSpec } from '../../utils/validations';
import type { BusinessUnitFormProps } from '../../types/ui.types';
import type { Address } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const BusinessUnitForm: React.FC<BusinessUnitFormProps> = ({ onClose, readOnly = false, onEnterEditMode }) => {
  const {
    businessUnit,
    setBusinessUnitDraft,
    saveBusinessUnit,
  } = useHrmOrganizationStore();
  
  // Get the store's get function to access current state
  const get = useHrmOrganizationStore.getState;

  const { draft, isSaving, isCreating, selected, errors } = businessUnit;
  const isNew = isCreating && !selected;
  const title = readOnly 
    ? `View: ${selected?.buName || ''}` 
    : isNew 
    ? 'New Business Unit' 
    : `Edit: ${selected?.buName || ''}`;

  const handleFieldChange = useCallback(
    (field: string, value: string | number | Record<string, string>) => {
      if (readOnly) return;
      setBusinessUnitDraft({ [field]: value });
    },
    [setBusinessUnitDraft, readOnly]
  );

  const handleAddressChange = useCallback(
    (field: string, value: string) => {
      if (readOnly) return;
      const currentAddress = draft?.address || { ...EMPTY_ADDRESS };
      const nextAddress = { ...currentAddress, [field]: value } as Address;
      // Keep `state` + `placeOfSupply` mirrored to the address state so the
      // three fields can never drift. The save payload derives from the
      // address state too, but syncing the draft here means audit diffs /
      // read-only views always reflect the same value.
      const mirrored =
        field === 'state'
          ? { state: value, placeOfSupply: value }
          : {};
      setBusinessUnitDraft({
        address: nextAddress,
        ...mirrored,
      });
    },
    [draft?.address, setBusinessUnitDraft, readOnly]
  );

  const handleSave = useCallback(async () => {
    try {
      await saveBusinessUnit();
      
      // Get the updated state after save completes
      const updatedState = get().businessUnit;
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
        message.success(isNew ? 'Business unit created' : 'Business unit updated');
      }
    } catch {
      message.error('Failed to save business unit');
    }
  }, [saveBusinessUnit, isNew]);

  const buCountry = draft?.address?.country || 'India';
  const isIndianBu = buCountry.trim().toLowerCase() === 'india';
  const taxIdLabel = getTaxIdLabel(buCountry);
  const taxIdSpec = getCountryValidationSpec(buCountry);
  const taxIdPlaceholder = isIndianBu
    ? 'e.g., 33AABCA1234D1Z5'
    : `Enter ${taxIdLabel}`;

  const generalContent = readOnly ? (
    <div className={formStyles.identityGrid}>
      <OrgViewField label="BU Code" value={draft?.buCode} required />
      <OrgViewField label="BU Name" value={draft?.buName} required />
      <OrgViewField label={taxIdLabel} value={draft?.gstin} required={isIndianBu} />
      <OrgViewField label="Primary Contact" value={draft?.primaryContact} required />
    </div>
  ) : (
    <div className={formStyles.identityGrid}>
      <OrgFormField label="BU Code" required error={errors.buCode}>
        <Input
          value={draft?.buCode || ''}
          onChange={(e) => handleFieldChange('buCode', e.target.value)}
          placeholder="e.g., BU-DUP-1772906680633"
          disabled={!isNew}
        />
      </OrgFormField>

      <OrgFormField label="BU Name" required error={errors.buName}>
        <Input
          value={draft?.buName || ''}
          onChange={(e) => handleFieldChange('buName', e.target.value)}
          placeholder="e.g., Tamil Nadu Operations"
        />
      </OrgFormField>

      <OrgFormField label={taxIdLabel} required={isIndianBu} error={errors.gstin}>
        <Input
          value={draft?.gstin || ''}
          onChange={(e) => handleFieldChange('gstin', e.target.value)}
          placeholder={taxIdPlaceholder}
          maxLength={taxIdSpec.taxIdMax + 2}
        />
      </OrgFormField>

      <OrgFormField label="Primary Contact" required error={errors.primaryContact}>
        <Input
          value={draft?.primaryContact || ''}
          onChange={(e) => handleFieldChange('primaryContact', e.target.value)}
          placeholder="e.g., contact@ritsctpl.com"
        />
      </OrgFormField>
    </div>
  );

  const addressContent = (
    <OrgAddressFields
      prefix="address"
      address={draft?.address || { line1: '', city: '', state: '', pincode: '', country: 'India' }}
      onChange={handleAddressChange}
      errors={errors}
      disabled={readOnly}
    />
  );

  return (
    <div className={mainStyles.formPanel}>
      <div className={mainStyles.formPanelHeader}>
        <span className={mainStyles.formPanelTitle}>{title}</span>
        <span style={{ display: 'inline-flex', gap: 4 }}>
          {onEnterEditMode && (
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={onEnterEditMode}
            >
              Edit
            </Button>
          )}
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </span>
      </div>

      <div className={formStyles.buFormSingle}>
        {generalContent}
        <div className={formStyles.buFormSectionHeading}>Address</div>
        {addressContent}
      </div>

      {errors._general && (
        <div style={{ color: '#ff4d4f', marginTop: 8 }}>{errors._general}</div>
      )}

      <div className={mainStyles.formActions}>
        <Button onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && (
          <Can I={isNew ? 'add' : 'edit'}>
            <OrgSaveButton
              loading={isSaving}
              onClick={handleSave}
              label={isNew ? 'Create' : 'Update'}
            />
          </Can>
        )}
      </div>
    </div>
  );
};

export default BusinessUnitForm;
