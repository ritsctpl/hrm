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

const BusinessUnitForm: React.FC<BusinessUnitFormProps> = ({ onClose }) => {
  const {
    businessUnit,
    setBusinessUnitDraft,
    saveBusinessUnit,
  } = useHrmOrganizationStore();

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
      message.success(isNew ? 'Business unit created' : 'Business unit updated');
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
          placeholder="Enter BU code"
          disabled={!isNew}
        />
      </OrgFormField>

      <OrgFormField label="BU Name" required error={errors.buName}>
        <Input
          value={draft?.buName || ''}
          onChange={(e) => handleFieldChange('buName', e.target.value)}
          placeholder="Enter BU name"
        />
      </OrgFormField>

      <OrgFormField label="BU Type" required error={errors.buType}>
        <Select
          value={draft?.buType || undefined}
          onChange={(val) => handleFieldChange('buType', val)}
          options={[...BU_TYPE_OPTIONS]}
          placeholder="Select type"
          style={{ width: '100%' }}
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

      <OrgFormField label="City" required error={errors.city}>
        <Input
          value={draft?.city || ''}
          onChange={(e) => handleFieldChange('city', e.target.value)}
          placeholder="Enter city"
        />
      </OrgFormField>

      <OrgFormField label="Active">
        <Switch
          checked={draft?.active === 1}
          onChange={(checked) => handleFieldChange('active', checked ? 1 : 0)}
        />
      </OrgFormField>
    </div>
  );

  // Contact Tab
  const contactContent = (
    <div className={formStyles.contactGrid}>
      <OrgFormField label="Contact Email" error={errors.contactEmail}>
        <Input
          value={draft?.contactEmail || ''}
          onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
          placeholder="e.g., bu@company.com"
          type="email"
        />
      </OrgFormField>

      <OrgFormField label="Contact Phone" error={errors.contactPhone}>
        <Input
          value={draft?.contactPhone || ''}
          onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
          placeholder="e.g., +91-9876543210"
        />
      </OrgFormField>
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

  // Statutory Tab
  const statutoryContent = (
    <div className={formStyles.statutoryGrid}>
      <OrgFormField label="GST Number">
        <Input
          value={draft?.statutoryRegistrationLinks?.gstNumber || ''}
          onChange={(e) => handleStatutoryChange('gstNumber', e.target.value)}
          placeholder="Enter GST number"
        />
      </OrgFormField>

      <OrgFormField label="Professional Tax No.">
        <Input
          value={draft?.statutoryRegistrationLinks?.ptNumber || ''}
          onChange={(e) => handleStatutoryChange('ptNumber', e.target.value)}
          placeholder="Enter PT number"
        />
      </OrgFormField>

      <OrgFormField label="Shop & Establishment No.">
        <Input
          value={draft?.statutoryRegistrationLinks?.shopEstNumber || ''}
          onChange={(e) => handleStatutoryChange('shopEstNumber', e.target.value)}
          placeholder="Enter S&E number"
        />
      </OrgFormField>

      <OrgFormField label="PF Sub-Code">
        <Input
          value={draft?.statutoryRegistrationLinks?.pfSubCode || ''}
          onChange={(e) => handleStatutoryChange('pfSubCode', e.target.value)}
          placeholder="Enter PF sub-code"
        />
      </OrgFormField>
    </div>
  );

  const tabItems = [
    { key: 'general', label: BU_TAB_LABELS.general, children: generalContent },
    { key: 'contact', label: BU_TAB_LABELS.contact, children: contactContent },
    { key: 'address', label: BU_TAB_LABELS.address, children: addressContent },
    { key: 'statutory', label: BU_TAB_LABELS.statutory, children: statutoryContent },
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
