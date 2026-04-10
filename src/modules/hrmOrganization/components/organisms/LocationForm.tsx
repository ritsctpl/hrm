'use client';

import React, { useCallback, useMemo } from 'react';
import { Input, Select, Button, Divider, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import OrgFormField from '../molecules/OrgFormField';
import OrgSaveButton from '../atoms/OrgSaveButton';
import Can from '../../../hrmAccess/components/Can';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { COUNTRY_OPTIONS, COUNTRY_STATES } from '../../utils/constants';
import { STATE_CITIES } from '../../utils/locationSearch';
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

      // Clear city when state changes
      if (field === 'state') {
        setLocationDraft({ city: '' });
      }
      // Clear state + city when country changes
      if (field === 'country') {
        setLocationDraft({ state: '', city: '' });
      }
    },
    [setLocationDraft]
  );

  // State options for selected country
  const stateOptions = useMemo(() => {
    const country = draft?.country || 'India';
    const states = COUNTRY_STATES[country] || [];
    return states.map((s) => ({ label: s, value: s }));
  }, [draft?.country]);

  // City options for selected state
  const cityOptions = useMemo(() => {
    const state = draft?.state || '';
    const cities = STATE_CITIES[state] || [];
    return cities.map((c) => ({ label: c, value: c }));
  }, [draft?.state]);

  const handleSave = useCallback(async () => {
    try {
      await saveLocation();
      message.success(isNew ? 'Location created' : 'Location updated');
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save location';
      message.error(errorMsg);
    }
  }, [saveLocation, isNew]);

  return (
    <div className={mainStyles.formPanel}>
      <div className={mainStyles.formPanelHeader}>
        <span className={mainStyles.formPanelTitle}>{title}</span>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
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
          <Select
            value={draft?.city || undefined}
            onChange={(val) => handleFieldChange('city', val)}
            options={cityOptions}
            placeholder={draft?.state ? 'Select or type city' : 'Select state first'}
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            disabled={!draft?.state}
            notFoundContent={draft?.state ? 'Type to add custom city' : 'Select state first'}
            // Allow custom city entry if not in list
            dropdownRender={(menu) => (
              <>
                {menu}
                {draft?.state && cityOptions.length > 0 && (
                  <>
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ padding: '4px 8px', fontSize: 11, color: '#8c8c8c' }}>
                      City not listed? Type in the search box
                    </div>
                  </>
                )}
              </>
            )}
            // Allow typing custom value not in the list
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onSearch={() => {}}
          />
        </OrgFormField>

        <OrgFormField label="PIN / ZIP" required error={errors?.pincode}>
          <Input
            value={draft?.pincode || ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, '');
              handleFieldChange('pincode', digits);
            }}
            placeholder="Enter PIN/ZIP code"
            maxLength={6}
          />
        </OrgFormField>
      </div>

      {errors?._general && (
        <div style={{ color: '#ff4d4f', marginTop: 8 }}>{errors._general}</div>
      )}

      <div className={mainStyles.formActions}>
        <Button onClick={onClose}>Cancel</Button>
        <Can I={isNew ? 'add' : 'edit'}>
          <OrgSaveButton
            loading={isSaving}
            onClick={handleSave}
            label={isNew ? 'Create' : 'Update'}
          />
        </Can>
      </div>
    </div>
  );
};

export default LocationForm;
