'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input, Select, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined, WarningFilled } from '@ant-design/icons';
import OrgFormField from './OrgFormField';
import OrgViewField from './OrgViewField';
import { COUNTRY_OPTIONS, COUNTRY_STATES } from '../../utils/constants';
import {
  isSixDigits,
  verifyPincode,
  type PincodeVerificationStatus,
} from '../../utils/pincodeVerification';
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

  // ------- Pincode verification (India only) -------
  const currentPincode = (address.pincode || address.pinCode || '').trim();
  const [verifyStatus, setVerifyStatus] = useState<PincodeVerificationStatus>('idle');
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastVerifiedRef = useRef<string>('');

  useEffect(() => {
    if (disabled) return;
    const country = address.country || 'India';
    if (country !== 'India') {
      setVerifyStatus('idle');
      setVerifyMessage('');
      return;
    }
    if (!isSixDigits(currentPincode)) {
      setVerifyStatus('idle');
      setVerifyMessage('');
      return;
    }
    if (currentPincode === lastVerifiedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    setVerifyStatus('loading');
    setVerifyMessage('Verifying...');

    const controller = new AbortController();
    abortRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      const result = await verifyPincode(currentPincode, controller.signal);
      if (controller.signal.aborted) return;

      lastVerifiedRef.current = currentPincode;
      setVerifyStatus(result.status);
      setVerifyMessage(result.message || '');

      if (result.status === 'success') {
        const validStates = COUNTRY_STATES[country] || [];
        const matchedState = result.state && validStates.find(
          (s) => s.toLowerCase() === result.state!.toLowerCase()
        );
        if (matchedState && address.state !== matchedState) {
          onChange('state', matchedState);
        }
        if (result.city && address.city !== result.city) {
          onChange('city', result.city);
        }
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPincode, address.country, disabled]);

  const pincodeFormatError = errors[`${prefix}.pincode`] || errors[`${prefix}.pinCode`];

  const pincodeSuffix = useMemo(() => {
    if (disabled || !isSixDigits(currentPincode)) return undefined;
    switch (verifyStatus) {
      case 'loading':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return (
          <Tooltip title={verifyMessage}>
            <CheckCircleFilled style={{ color: '#52c41a' }} />
          </Tooltip>
        );
      case 'error':
        return (
          <Tooltip title={verifyMessage}>
            <CloseCircleFilled style={{ color: '#ff4d4f' }} />
          </Tooltip>
        );
      case 'network-error':
        return (
          <Tooltip title={verifyMessage || 'Could not verify pincode online — format OK'}>
            <WarningFilled style={{ color: '#faad14' }} />
          </Tooltip>
        );
      default:
        return undefined;
    }
  }, [verifyStatus, verifyMessage, disabled, currentPincode]);

  // Display error for pincode: format error wins, else live verification error
  const pincodeError = pincodeFormatError
    || (verifyStatus === 'error' ? verifyMessage : undefined);

  // Hint line for success/network-error states (below field, subtle)
  const pincodeHint = verifyStatus === 'success'
    ? verifyMessage
    : verifyStatus === 'network-error'
    ? 'Could not verify online — please double-check city & state'
    : '';

  return (
    <div className={formStyles.addressFields}>
      {disabled ? (
        <>
          <div className={formStyles.addressFieldFull}>
            <OrgViewField
              label="Address Line 1"
              value={address.line1}
            />
          </div>
          <OrgViewField label="Country" value={address.country || 'India'} />
          <OrgViewField label="State" value={address.state} />
          <OrgViewField label="City" value={address.city} />
          <OrgViewField label="PIN Code" value={address.pincode || address.pinCode} />
        </>
      ) : (
        <>
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

          <OrgFormField label="PIN Code" error={pincodeError}>
            <Input
              value={address.pincode || address.pinCode || ''}
              onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter PIN code"
              maxLength={6}
              disabled={disabled}
              suffix={pincodeSuffix}
            />
            {!pincodeError && pincodeHint && (
              <div
                style={{
                  fontSize: 12,
                  marginTop: 2,
                  color: verifyStatus === 'success' ? '#52c41a' : '#faad14',
                }}
              >
                {pincodeHint}
              </div>
            )}
          </OrgFormField>
        </>
      )}
    </div>
  );
};

export default OrgAddressFields;
