'use client';

import React, { useCallback, useMemo } from 'react';
import { Input, Select, Button, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import OrgSaveButton from '../atoms/OrgSaveButton';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { COUNTRY_OPTIONS, COUNTRY_STATES } from '../../utils/constants';
import type { LocationFormProps } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const LocationForm: React.FC<LocationFormProps> = ({ onClose }) => {
  const {
    location,
    setLocationDraft,
    saveLocation,
  } = useHrmOrganizationStore();

  const { draft, isSaving, isCreating, selected, errors } = location;
  const isNew = isCreating && !selected;
  const title = isNew ? 'New Location' : `Edit: ${selected?.name || ''}`;

  const handleFieldChange = useCallback(
    (field: string, value: string | number) => {
      setLocationDraft({ [field]: value });
    },
    [setLocationDraft]
  );

  // Get states for selected country
  const stateOptions = useMemo(() => {
    const country = draft?.country || 'India';
    const states = COUNTRY_STATES[country] || [];
    return states.map((s) => ({ label: s, value: s }));
  }, [draft?.country]);

  const handleSave = useCallback(async () => {
    try {
      await saveLocation();
      // Only show success if no error was thrown
      message.success(isNew ? 'Location created' : 'Location updated');
    } catch (error: unknown) {
      // Don't show popup, error will be displayed in form
      const errorMsg = error instanceof Error ? error.message : 'Failed to save location';
      console.error('Save error:', errorMsg);
    }
  }, [saveLocation, isNew]);

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

      <div className={formStyles.identityGrid}>
        <OrgFormField label="Location Code" required error={errors?.code}>
          <Input
            value={draft?.code || ''}
            onChange={(e) => handleFieldChange('code', e.target.value)}
            placeholder="Enter location code"
            disabled={!isNew}
          />
        </OrgFormField>

        <OrgFormField label="Location Name" required error={errors?.name}>
          <Input
            value={draft?.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Enter location name"
          />
        </OrgFormField>

        <div className={formStyles.identityFullWidth}>
          <OrgFormField label="Address Line 1" required error={errors?.addressLine1}>
            <Input
              value={draft?.addressLine1 || ''}
              onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
              placeholder="Enter address line 1"
            />
          </OrgFormField>
        </div>

        <div className={formStyles.identityFullWidth}>
          <OrgFormField label="Address Line 2">
            <Input
              value={draft?.addressLine2 ?? ''}
              onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
              placeholder="Enter address line 2"
            />
          </OrgFormField>
        </div>

        <OrgFormField label="Country" required error={errors?.country}>
          <Select
            value={draft?.country || 'India'}
            onChange={(val) => handleFieldChange('country', val)}
            options={[...COUNTRY_OPTIONS]}
            placeholder="Select country"
            style={{ width: '100%' }}
          />
        </OrgFormField>

        <OrgFormField label="State" required error={errors?.state}>
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

        <OrgFormField label="City" required error={errors?.city}>
          <Input
            value={draft?.city || ''}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder="Enter city"
          />
        </OrgFormField>

        <OrgFormField label="PIN / ZIP" required error={errors?.pincode}>
          <Input
            value={draft?.pincode || ''}
            onChange={(e) => handleFieldChange('pincode', e.target.value)}
            placeholder="Enter PIN/ZIP code"
          />
        </OrgFormField>

  
      </div>

      {errors?._general && (
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

export default LocationForm;
