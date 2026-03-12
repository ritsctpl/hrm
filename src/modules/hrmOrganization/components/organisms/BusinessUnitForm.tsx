'use client';

import React, { useCallback } from 'react';
import { Input, Select, Tabs, Button, Switch, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import OrgAddressFields from '../molecules/OrgAddressFields';
import OrgSaveButton from '../atoms/OrgSaveButton';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { BU_TYPE_OPTIONS, INDIAN_STATES, EMPTY_ADDRESS, BU_TAB_LABELS } from '../../utils/constants';
import type { BusinessUnitFormProps } from '../../types/ui.types';
import type { Address } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const stateOptions = INDIAN_STATES.map((s) => ({ label: s, value: s }));
const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const BusinessUnitForm: React.FC<BusinessUnitFormProps> = ({ onClose }) => {
  const {
    businessUnit,
    setBusinessUnitDraft,
    saveBusinessUnit,
  } = useHrmOrganizationStore();
  
  // Get the store's get function to access current state
  const get = useHrmOrganizationStore.getState;

  const { draft, isSaving, isCreating, selected, errors } = businessUnit;
  const isNew = isCreating && !selected;
  const title = isNew ? 'New Business Unit' : `Edit: ${selected?.buName || ''}`;

  const handleFieldChange = useCallback(
    (field: string, value: string | number | Record<string, string>) => {
      setBusinessUnitDraft({ [field]: value });
    },
    [setBusinessUnitDraft]
  );

  const handleAddressChange = useCallback(
    (field: string, value: string) => {
      const currentAddress = draft?.address || { ...EMPTY_ADDRESS };
      setBusinessUnitDraft({
        address: { ...currentAddress, [field]: value } as Address,
      });
    },
    [draft?.address, setBusinessUnitDraft]
  );

  const handleStatutoryChange = useCallback(
    (field: string, value: string) => {
      const current = draft?.statutoryRegistrationLinks || {};
      setBusinessUnitDraft({
        statutoryRegistrationLinks: { ...current, [field]: value },
      });
    },
    [draft?.statutoryRegistrationLinks, setBusinessUnitDraft]
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

  // General Tab
  const generalContent = (
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

      <OrgFormField label="State" required error={errors.state}>
        <Select
          value={draft?.state || undefined}
          onChange={(val) => handleFieldChange('state', val)}
          options={stateOptions}
          placeholder="Select state"
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
        />
      </OrgFormField>

      <OrgFormField label="Place of Supply" required error={errors.placeOfSupply}>
        <Select
          value={draft?.placeOfSupply || undefined}
          onChange={(val) => handleFieldChange('placeOfSupply', val)}
          options={stateOptions}
          placeholder="Select place of supply"
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
        />
      </OrgFormField>

      <OrgFormField label="GSTIN" required error={errors.gstin}>
        <Input
          value={draft?.gstin || ''}
          onChange={(e) => handleFieldChange('gstin', e.target.value)}
          placeholder="e.g., 33AABCA1234D1Z5"
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

  // Contact Tab - Removed, now in General Tab
  const contactContent = (
    <div className={formStyles.contactGrid}>
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Contact information is now in the General tab
      </div>
    </div>
  );

  // Address Tab
  const addressContent = (
    <OrgAddressFields
      prefix="address"
      address={draft?.address || {}}
      onChange={handleAddressChange}
      errors={errors}
    />
  );

  // Statutory Tab - Removed, GSTIN now in General Tab
  const statutoryContent = (
    <div className={formStyles.statutoryGrid}>
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        GSTIN is now in the General tab
      </div>
    </div>
  );

  const tabItems = [
    { key: 'general', label: 'General', children: generalContent },
    { key: 'address', label: 'Address', children: addressContent },
  ];

  return (
    <div className={mainStyles.formPanel}>
      <div className={mainStyles.formPanelHeader}>
        <span className={mainStyles.formPanelTitle}>{title}</span>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
        />
      </div>

      <Tabs
        items={tabItems}
        size="small"
        className={formStyles.buFormTabs}
      />

      {errors._general && (
        <div style={{ color: '#ff4d4f', marginTop: 8 }}>{errors._general}</div>
      )}

      <div className={mainStyles.formActions}>
        <Button onClick={onClose}>Cancel</Button>
        <OrgSaveButton
          loading={isSaving}
          onClick={handleSave}
          label={isNew ? 'Create' : 'Update'}
        />
      </div>
    </div>
  );
};

export default BusinessUnitForm;
