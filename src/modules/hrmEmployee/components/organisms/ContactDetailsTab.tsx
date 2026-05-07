/**
 * ContactDetailsTab - View/edit addresses and emergency contacts
 * Uses flat field structure for API payload:
 * presentAddress, permanentAddress, city, state, country, pinZip, emergencyContacts
 */

'use client';

import React, { useState, useImperativeHandle, forwardRef, useCallback, useEffect, useRef } from 'react';
import { AutoComplete, Button, Input, Form, Divider, Select, Tooltip, message } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  WarningFilled,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import EmpFieldLabel from '../atoms/EmpFieldLabel';
import type { ProfileTabProps } from '../../types/ui.types';
import type { EmergencyContact } from '../../types/domain.types';
import { COUNTRY_OPTIONS, COUNTRY_STATE_MAP } from '../../utils/constants';
// Pincode utilities live in hrmOrganization (single source of truth for
// the same auto-fill UX used in Org Setup → Locations / BU addresses).
// Cross-module import is acceptable here per the EN-PINCODE doc; if these
// utilities ever move to a shared location, only these import paths need
// to change.
import {
  searchPincodesByPrefix,
  type PincodeEntry,
} from '../../../hrmOrganization/utils/pincodeData';
import {
  verifyPincode,
  isSixDigits,
  type PincodeVerificationStatus,
} from '../../../hrmOrganization/utils/pincodeVerification';
import styles from '../../styles/HrmEmployeeTable.module.css';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

// Visual indicator for the live India-Post verification suffix on the
// PIN/ZIP input — shared between Present and Permanent address blocks.
const PincodeStatusIcon: React.FC<{
  status: PincodeVerificationStatus;
  message?: string;
}> = ({ status, message: msg }) => {
  switch (status) {
    case 'loading':
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    case 'success':
      return (
        <Tooltip title={msg}>
          <CheckCircleFilled style={{ color: '#52c41a' }} />
        </Tooltip>
      );
    case 'error':
      return (
        <Tooltip title={msg}>
          <CloseCircleFilled style={{ color: '#ff4d4f' }} />
        </Tooltip>
      );
    case 'network-error':
      return (
        <Tooltip title={msg || 'Could not verify pincode online — format OK'}>
          <WarningFilled style={{ color: '#faad14' }} />
        </Tooltip>
      );
    default:
      return null;
  }
};

export interface ContactDetailsTabHandle {
  save: () => Promise<void>;
  cancel: () => void;
}

const ContactDetailsTab = forwardRef<ContactDetailsTabHandle, ProfileTabProps>(({
  profile,
  isEditing,
  isSaving,
  onSave,
  onEdit,
  editingSection,
}, ref) => {
  const { contactDetails } = profile;
  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);
  const [presentCountry, setPresentCountry] = useState<string>('');
  const [permanentCountry, setPermanentCountry] = useState<string>('');

  // Sync with parent isEditing state - enter edit mode when parent says to
  React.useEffect(() => {
    if (isEditing && editingSection === 'contact') {
      setLocalEditing(true);
      // Initialize country states
      const presentAddr = contactDetails.presentAddress;
      const permAddr = contactDetails.permanentAddress;
      
      if (typeof presentAddr === 'object' && presentAddr) {
        setPresentCountry(presentAddr.country || '');
      } else {
        setPresentCountry(contactDetails.country || '');
      }
      
      if (typeof permAddr === 'object' && permAddr) {
        setPermanentCountry(permAddr.country || '');
      }
    } else {
      setLocalEditing(false);
    }
  }, [isEditing, editingSection, contactDetails]);

  const handlePresentCountryChange = (value: string) => {
    setPresentCountry(value);
    // Country change invalidates state + city + pin — they're scoped
    // per-country (state list comes from COUNTRY_STATE_MAP, pincode
    // dataset is India-only).
    form.setFieldsValue({
      presentState: undefined,
      presentCity: undefined,
      presentPinZip: undefined,
    });
    setPresentVerifyStatus('idle');
    setPresentVerifyMessage('');
    setPresentPincodeOptions([]);
  };

  const handlePermanentCountryChange = (value: string) => {
    setPermanentCountry(value);
    form.setFieldsValue({
      permanentState: undefined,
      permanentCity: undefined,
      permanentPinZip: undefined,
    });
    setPermanentVerifyStatus('idle');
    setPermanentVerifyMessage('');
    setPermanentPincodeOptions([]);
  };

  // ── Pincode auto-fill state ──────────────────────────────────────
  // Each address block (present, permanent) gets its own slice of
  // suggestion options + live verification status. Refs hold the
  // debounce timer + abort controller so the in-flight verify can be
  // cancelled when the user keeps typing.
  const [presentPincodeOptions, setPresentPincodeOptions] = useState<
    Array<{ value: string; label: React.ReactNode }>
  >([]);
  const [presentVerifyStatus, setPresentVerifyStatus] =
    useState<PincodeVerificationStatus>('idle');
  const [presentVerifyMessage, setPresentVerifyMessage] = useState('');
  const presentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presentAbortRef = useRef<AbortController | null>(null);
  const presentLastVerifiedRef = useRef('');

  const [permanentPincodeOptions, setPermanentPincodeOptions] = useState<
    Array<{ value: string; label: React.ReactNode }>
  >([]);
  const [permanentVerifyStatus, setPermanentVerifyStatus] =
    useState<PincodeVerificationStatus>('idle');
  const [permanentVerifyMessage, setPermanentVerifyMessage] = useState('');
  const permanentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permanentAbortRef = useRef<AbortController | null>(null);
  const permanentLastVerifiedRef = useRef('');

  const presentPinValue = Form.useWatch('presentPinZip', form);
  const permanentPinValue = Form.useWatch('permanentPinZip', form);

  // Suggest pincodes from the local dataset as the user types (India only).
  useEffect(() => {
    if (presentCountry !== 'India') {
      setPresentPincodeOptions([]);
      return;
    }
    const pin = (presentPinValue ?? '').toString().trim();
    if (pin.length < 3) {
      setPresentPincodeOptions([]);
      return;
    }
    let cancelled = false;
    searchPincodesByPrefix(pin, 20).then((rows: PincodeEntry[]) => {
      if (cancelled) return;
      setPresentPincodeOptions(
        rows.map((r) => ({
          value: r.pincode,
          label: (
            <span>
              <strong>{r.pincode}</strong>{' '}
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                {r.city}, {r.state}
              </span>
            </span>
          ),
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [presentPinValue, presentCountry]);

  useEffect(() => {
    if (permanentCountry !== 'India') {
      setPermanentPincodeOptions([]);
      return;
    }
    const pin = (permanentPinValue ?? '').toString().trim();
    if (pin.length < 3) {
      setPermanentPincodeOptions([]);
      return;
    }
    let cancelled = false;
    searchPincodesByPrefix(pin, 20).then((rows: PincodeEntry[]) => {
      if (cancelled) return;
      setPermanentPincodeOptions(
        rows.map((r) => ({
          value: r.pincode,
          label: (
            <span>
              <strong>{r.pincode}</strong>{' '}
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                {r.city}, {r.state}
              </span>
            </span>
          ),
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [permanentPinValue, permanentCountry]);

  // Live verification against India Post once a full 6-digit pincode is
  // entered. Debounced 500ms; aborts the previous fetch on each keystroke.
  // On success, auto-fills state + city.
  useEffect(() => {
    if (presentCountry !== 'India') {
      setPresentVerifyStatus('idle');
      setPresentVerifyMessage('');
      return;
    }
    const pin = (presentPinValue ?? '').toString().trim();
    if (!isSixDigits(pin)) {
      setPresentVerifyStatus('idle');
      setPresentVerifyMessage('');
      return;
    }
    if (pin === presentLastVerifiedRef.current) return;

    if (presentDebounceRef.current) clearTimeout(presentDebounceRef.current);
    if (presentAbortRef.current) presentAbortRef.current.abort();

    setPresentVerifyStatus('loading');
    setPresentVerifyMessage('Verifying...');

    const controller = new AbortController();
    presentAbortRef.current = controller;

    presentDebounceRef.current = setTimeout(async () => {
      const result = await verifyPincode(pin, controller.signal);
      if (controller.signal.aborted) return;
      presentLastVerifiedRef.current = pin;
      setPresentVerifyStatus(result.status);
      setPresentVerifyMessage(result.message || '');
      if (result.status === 'success') {
        const validStates = COUNTRY_STATE_MAP['India'] || [];
        const matchedState = result.state && validStates.find(
          (s) => s.toLowerCase() === result.state!.toLowerCase(),
        );
        const patch: Record<string, unknown> = {};
        if (matchedState) patch.presentState = matchedState;
        else if (result.state) patch.presentState = result.state;
        if (result.city) patch.presentCity = result.city;
        if (Object.keys(patch).length > 0) form.setFieldsValue(patch);
      }
    }, 500);

    return () => {
      if (presentDebounceRef.current) clearTimeout(presentDebounceRef.current);
      controller.abort();
    };
  }, [presentPinValue, presentCountry, form]);

  useEffect(() => {
    if (permanentCountry !== 'India') {
      setPermanentVerifyStatus('idle');
      setPermanentVerifyMessage('');
      return;
    }
    const pin = (permanentPinValue ?? '').toString().trim();
    if (!isSixDigits(pin)) {
      setPermanentVerifyStatus('idle');
      setPermanentVerifyMessage('');
      return;
    }
    if (pin === permanentLastVerifiedRef.current) return;

    if (permanentDebounceRef.current) clearTimeout(permanentDebounceRef.current);
    if (permanentAbortRef.current) permanentAbortRef.current.abort();

    setPermanentVerifyStatus('loading');
    setPermanentVerifyMessage('Verifying...');

    const controller = new AbortController();
    permanentAbortRef.current = controller;

    permanentDebounceRef.current = setTimeout(async () => {
      const result = await verifyPincode(pin, controller.signal);
      if (controller.signal.aborted) return;
      permanentLastVerifiedRef.current = pin;
      setPermanentVerifyStatus(result.status);
      setPermanentVerifyMessage(result.message || '');
      if (result.status === 'success') {
        const validStates = COUNTRY_STATE_MAP['India'] || [];
        const matchedState = result.state && validStates.find(
          (s) => s.toLowerCase() === result.state!.toLowerCase(),
        );
        const patch: Record<string, unknown> = {};
        if (matchedState) patch.permanentState = matchedState;
        else if (result.state) patch.permanentState = result.state;
        if (result.city) patch.permanentCity = result.city;
        if (Object.keys(patch).length > 0) form.setFieldsValue(patch);
      }
    }, 500);

    return () => {
      if (permanentDebounceRef.current) clearTimeout(permanentDebounceRef.current);
      controller.abort();
    };
  }, [permanentPinValue, permanentCountry, form]);

  // When the user picks a row from the AutoComplete, copy the matching
  // city + state from the dataset entry directly (no API round-trip).
  const handlePresentPincodeSelect = useCallback(
    async (pin: string) => {
      const rows = await searchPincodesByPrefix(pin, 1);
      if (rows[0]) {
        form.setFieldsValue({
          presentState: rows[0].state,
          presentCity: rows[0].city,
          presentPinZip: pin,
        });
        // Stamp the verified ref so the live-verification effect doesn't
        // immediately re-fire for the same pin.
        presentLastVerifiedRef.current = pin;
        setPresentVerifyStatus('success');
        setPresentVerifyMessage(`${rows[0].city}, ${rows[0].state}`);
      }
    },
    [form],
  );

  const handlePermanentPincodeSelect = useCallback(
    async (pin: string) => {
      const rows = await searchPincodesByPrefix(pin, 1);
      if (rows[0]) {
        form.setFieldsValue({
          permanentState: rows[0].state,
          permanentCity: rows[0].city,
          permanentPinZip: pin,
        });
        permanentLastVerifiedRef.current = pin;
        setPermanentVerifyStatus('success');
        setPermanentVerifyMessage(`${rows[0].city}, ${rows[0].state}`);
      }
    },
    [form],
  );

  const handleCopyPresentToPermanent = useCallback(() => {
    const present = {
      address: form.getFieldValue('presentAddress') || '',
      city: form.getFieldValue('presentCity') || '',
      state: form.getFieldValue('presentState') || '',
      country: form.getFieldValue('presentCountry') || '',
      pinZip: form.getFieldValue('presentPinZip') || '',
    };
    const hasAny = Boolean(
      present.address || present.city || present.state || present.country || present.pinZip
    );
    if (!hasAny) {
      message.info('Fill in the present address first, then copy');
      return;
    }
    // Sync the country-dependent state first so the permanent State dropdown
    // renders the correct option list before we set its value.
    setPermanentCountry(present.country);
    form.setFieldsValue({
      permanentAddress: present.address,
      permanentCity: present.city,
      permanentCountry: present.country,
      permanentState: present.state,
      permanentPinZip: present.pinZip,
    });
    message.success('Copied present address to permanent address');
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Build nested address objects for API
      const presentAddress = values.presentAddress || values.presentCity || values.presentState || values.presentCountry || values.presentPinZip
        ? {
            address: values.presentAddress || '',
            city: values.presentCity || '',
            state: values.presentState || '',
            country: values.presentCountry || '',
            pinZip: values.presentPinZip || '',
          }
        : undefined;

      const permanentAddress = values.permanentAddress || values.permanentCity || values.permanentState || values.permanentCountry || values.permanentPinZip
        ? {
            address: values.permanentAddress || '',
            city: values.permanentCity || '',
            state: values.permanentState || '',
            country: values.permanentCountry || '',
            pinZip: values.permanentPinZip || '',
          }
        : undefined;

      await onSave('contact', {
        presentAddress,
        permanentAddress,
        emergencyContacts: values.emergencyContacts as EmergencyContact[],
      });
      setLocalEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to save contact details. Please try again.');
      }
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    cancel: () => {
      setLocalEditing(false);
      setPresentCountry('');
      setPermanentCountry('');
      form.resetFields();
    },
  }));

  const editing = localEditing;
  const presentStateOptions = presentCountry ? (COUNTRY_STATE_MAP[presentCountry] || []) : [];
  const permanentStateOptions = permanentCountry ? (COUNTRY_STATE_MAP[permanentCountry] || []) : [];

  if (editing) {
    // Extract address strings from nested objects for form initialization
    const presentAddr = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.address
      : contactDetails.presentAddress || '';
    
    const permanentAddr = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.address
      : contactDetails.permanentAddress || '';

    const presentCity = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.city
      : contactDetails.city || '';

    const presentState = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.state
      : contactDetails.state || '';

    const presentCountryVal = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.country
      : contactDetails.country || '';

    const presentPinZip = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
      ? contactDetails.presentAddress.pinZip
      : contactDetails.pinZip || '';

    const permanentCity = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.city
      : '';

    const permanentState = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.state
      : '';

    const permanentCountryVal = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.country
      : '';

    const permanentPinZip = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
      ? contactDetails.permanentAddress.pinZip
      : '';

    return (
      <div className={styles.tabContent}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            presentAddress: presentAddr,
            presentCity: presentCity,
            presentState: presentState,
            presentCountry: presentCountryVal,
            presentPinZip: presentPinZip,
            permanentAddress: permanentAddr,
            permanentCity: permanentCity,
            permanentState: permanentState,
            permanentCountry: permanentCountryVal,
            permanentPinZip: permanentPinZip,
            emergencyContacts: contactDetails.emergencyContacts || [],
          }}
        >
          {/* Present Address Section */}
          <Divider orientation="left" style={{ fontSize: 13, marginTop: 0 }}>
            Present Address
          </Divider>
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="presentAddress"
              label="Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea rows={2} placeholder="Enter present address" />
            </Form.Item>
          </div>

          {/* Field order: Country → State → City → PIN/ZIP. Country drives
              the state list; state drives city; PIN is the most specific
              and lives last (matching OrgAddressFields in Organization Setup). */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Form.Item
              name="presentCountry"
              label="Country"
              rules={[{ required: false }]}
            >
              <Select
                placeholder="Select country"
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country,
                  label: country,
                }))}
                onChange={handlePresentCountryChange}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="presentState"
              label="State/Province"
              rules={[{ required: false }]}
            >
              <Select
                placeholder={presentCountry ? 'Select state' : 'Select country first'}
                options={presentStateOptions.map((state) => ({
                  value: state,
                  label: state,
                }))}
                disabled={!presentCountry}
                showSearch
                allowClear
              />
            </Form.Item>
            <Form.Item name="presentCity" label="City">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item name="presentPinZip" label="PIN/ZIP Code">
              {presentCountry === 'India' ? (
                <AutoComplete
                  options={presentPincodeOptions}
                  onSelect={handlePresentPincodeSelect}
                  // AutoComplete delegates value/onChange to its child Input;
                  // typing 3+ digits triggers the suggestion effect above
                  // and selecting one auto-fills state + city.
                  popupMatchSelectWidth={300}
                >
                  <Input
                    placeholder="PIN Code"
                    maxLength={6}
                    inputMode="numeric"
                    suffix={
                      isSixDigits((presentPinValue ?? '').toString()) ? (
                        <PincodeStatusIcon
                          status={presentVerifyStatus}
                          message={presentVerifyMessage}
                        />
                      ) : null
                    }
                  />
                </AutoComplete>
              ) : (
                <Input placeholder="PIN/ZIP Code" />
              )}
            </Form.Item>
          </div>

          {/* Permanent Address Section */}
          <Divider orientation="left" style={{ fontSize: 13 }}>
            Permanent Address
          </Divider>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyPresentToPermanent}
              style={{ padding: 0, fontSize: 12 }}
            >
              Same as present address
            </Button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="permanentAddress"
              label="Address"
              rules={[{ required: false }]}
            >
              <Input.TextArea rows={2} placeholder="Enter permanent address" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Form.Item
              name="permanentCountry"
              label="Country"
              rules={[{ required: false }]}
            >
              <Select
                placeholder="Select country"
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country,
                  label: country,
                }))}
                onChange={handlePermanentCountryChange}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="permanentState"
              label="State/Province"
              rules={[{ required: false }]}
            >
              <Select
                placeholder={permanentCountry ? 'Select state' : 'Select country first'}
                options={permanentStateOptions.map((state) => ({
                  value: state,
                  label: state,
                }))}
                disabled={!permanentCountry}
                showSearch
                allowClear
              />
            </Form.Item>
            <Form.Item name="permanentCity" label="City">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item name="permanentPinZip" label="PIN/ZIP Code">
              {permanentCountry === 'India' ? (
                <AutoComplete
                  options={permanentPincodeOptions}
                  onSelect={handlePermanentPincodeSelect}
                  popupMatchSelectWidth={300}
                >
                  <Input
                    placeholder="PIN Code"
                    maxLength={6}
                    inputMode="numeric"
                    suffix={
                      isSixDigits((permanentPinValue ?? '').toString()) ? (
                        <PincodeStatusIcon
                          status={permanentVerifyStatus}
                          message={permanentVerifyMessage}
                        />
                      ) : null
                    }
                  />
                </AutoComplete>
              ) : (
                <Input placeholder="PIN/ZIP Code" />
              )}
            </Form.Item>
          </div>

          <Divider orientation="left" style={{ fontSize: 13 }}>
            Emergency Contacts
          </Divider>

          <Form.List name="emergencyContacts">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      padding: 12,
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      marginBottom: 12,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, flex: 1 }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="Name"
                        rules={[{ required: true, message: 'Name required' }]}
                      >
                        <Input placeholder="Name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'relationship']}
                        label="Relationship"
                      >
                        <Input placeholder="Relationship" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'phone']}
                        label="Phone"
                        rules={[
                          { required: true, message: 'Phone required' },
                          { pattern: /^[\d\s\-\+\(\)]+$/, message: 'Invalid phone format' },
                        ]}
                      >
                        <Input placeholder="Phone" />
                      </Form.Item>
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      size="small"
                      style={{ marginTop: 24 }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginBottom: 12 }}
                >
                  Add Emergency Contact
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </div>
    );
  }

  const emergencyContacts = contactDetails.emergencyContacts || [];

  // Extract display values from nested objects - ensure they're always strings
  const presentAddr: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.address || '--'
    : (contactDetails.presentAddress as string) || '--';

  const permanentAddr: string = typeof contactDetails.permanentAddress === 'object' && contactDetails.permanentAddress
    ? contactDetails.permanentAddress.address || '--'
    : (contactDetails.permanentAddress as string) || '--';

  const city: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.city || '--'
    : contactDetails.city || '--';

  const state: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.state || '--'
    : contactDetails.state || '--';

  const country: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.country || '--'
    : contactDetails.country || '--';

  const pinZip: string = typeof contactDetails.presentAddress === 'object' && contactDetails.presentAddress
    ? contactDetails.presentAddress.pinZip || '--'
    : contactDetails.pinZip || '--';

  return (
    <div className={styles.tabContent}>
      {/* Field order: Country → State → City → PIN/ZIP, matching the
          edit-mode grid above and OrgAddressFields in Org Setup. */}
      <div className={styles.detailGrid}>
        <EmpFieldLabel
          label="Present Address"
          value={presentAddr}
        />
        <EmpFieldLabel
          label="Permanent Address"
          value={permanentAddr}
        />
        <EmpFieldLabel
          label="Country"
          value={country}
        />
        <EmpFieldLabel
          label="State/Province"
          value={state}
        />
        <EmpFieldLabel
          label="City"
          value={city}
        />
        <EmpFieldLabel
          label="PIN/ZIP Code"
          value={pinZip}
        />
      </div>

      <Divider orientation="left" style={{ fontSize: 13 }}>
        Emergency Contacts
      </Divider>

      {emergencyContacts.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>No emergency contacts on file.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {emergencyContacts.map((ec, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Name</div>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 4 }}>{ec.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Relationship</div>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 4 }}>{ec.relationship || '--'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Phone</div>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 4 }}>{ec.phone}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ContactDetailsTab.displayName = 'ContactDetailsTab';

export default ContactDetailsTab;
