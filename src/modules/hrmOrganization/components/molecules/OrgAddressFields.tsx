'use client';

import React, { useCallback, useMemo } from 'react';
import { Input, Select } from 'antd';
import OrgFormField from './OrgFormField';
import { COUNTRY_OPTIONS, COUNTRY_STATES } from '../../utils/constants';
import type { OrgAddressFieldsProps } from '../../types/ui.types';
import formStyles from '../../styles/HrmOrganizationForm.module.css';

const OrgAddressFields: React.FC<OrgAddressFieldsProps> = ({
  prefix,
  address,
  onChange,
  errors = {},
  disabled = false,
}) => {
  const handleChange = useCallback(
    (field: string, value: string) => {
      onChange(field, value);
    },
    [onChange]
  );

  // Get states for selected country
  const stateOptions = useMemo(() => {
    const country = address.country || 'India';
    const states = COUNTRY_STATES[country] || [];
    return states.map((s) => ({ label: s, value: s }));
  }, [address.country]);

  return (
    <div className={formStyles.addressFields}>
      <div className={formStyles.addressFieldFull}>
        <OrgFormField
          label="Address Line 1"
          error={errors[`${prefix}.line1`]}
        >
          <Input
            value={address.line1 || ''}
            onChange={(e) => handleChange('line1', e.target.value)}
            placeholder="Enter address line 1"
            disabled={disabled}
          />
        </OrgFormField>
      </div>

      <OrgFormField label="Country" error={errors[`${prefix}.country`]}>
        <Select
          value={address.country || 'India'}
          onChange={(val) => handleChange('country', val)}
          options={[...COUNTRY_OPTIONS]}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </OrgFormField>

      <OrgFormField label="State" error={errors[`${prefix}.state`]}>
        <Select
          value={address.state || undefined}
          onChange={(val) => handleChange('state', val)}
          placeholder="Select state"
          showSearch
          optionFilterProp="label"
          options={stateOptions}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </OrgFormField>

      <OrgFormField label="City" error={errors[`${prefix}.city`]}>
        <Input
          value={address.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="Enter city"
          disabled={disabled}
        />
      </OrgFormField>

      <OrgFormField label="PIN Code" error={errors[`${prefix}.pincode`] || errors[`${prefix}.pinCode`]}>
        <Input
          value={address.pincode || address.pinCode || ''}
          onChange={(e) => handleChange('pincode', e.target.value)}
          placeholder="Enter PIN code"
          maxLength={6}
          disabled={disabled}
        />
      </OrgFormField>
    </div>
  );
};

export default OrgAddressFields;
