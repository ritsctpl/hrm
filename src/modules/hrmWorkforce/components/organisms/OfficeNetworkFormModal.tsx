'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Form, Input, Modal, Select } from 'antd';
import { parseFingerprintList, useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { OfficeNetwork, OfficeNetworkSaveRequest } from '../../types/api.types';
import styles from '../../styles/Workforce.module.css';

const { TextArea } = Input;

interface Props {
  open: boolean;
  /** The row being edited, or null/undefined for a fresh create. */
  editing?: OfficeNetwork | null;
  onClose: () => void;
}

/** The form's field values — the three fingerprint dimensions are raw textareas until submit. */
interface FormValues {
  label: string;
  locationType: string;
  locationId?: string;
  gatewayMacs?: string;
  bssids?: string;
  egressIps?: string;
}

/** A `string[]` back to the one-per-line text an edit textarea binds to. */
const toText = (values?: string[]): string => (values ?? []).join('\n');

/**
 * Create or edit one office-network fingerprint.
 *
 * <b>Label plus at least one fingerprint.</b> A label is required by the form; on submit the three
 * textareas are split with the tested `parseFingerprintList`, and if all three come back empty the
 * save is blocked with a form-level error rather than sent — a network identified by nothing would
 * match nothing, so it is not a network the registry can use. An empty individual list stays
 * legitimate: "this dimension is not fingerprinted".
 *
 * <b>Success and failure are told apart through the store, not a return value.</b> `saveOfficeNetwork`
 * swallows its own errors (it raises the toast and stamps `store.error`), so this modal reads
 * `store.error` after the await: cleared means the save landed and the modal closes over a list the
 * hook has already reloaded; still set — a validation 400, a duplicate-fingerprint clash — means the
 * modal stays open with the operator's input intact so they can fix it and retry. The backend's own
 * sentence is already on screen via the hook's `message.error`; this modal invents no wording for it.
 *
 * <b>Fields are pushed on open, not seeded once.</b> AntD caches `initialValues`, so edit-vs-add and
 * one edited row vs the next are applied with `setFieldsValue` / `resetFields` keyed on the dialog
 * opening — otherwise the second network edited would wear the first one's values.
 */
const OfficeNetworkFormModal: React.FC<Props> = ({ open, editing, onClose }) => {
  const [form] = Form.useForm<FormValues>();
  const { saveOfficeNetwork } = useHrmWorkforceData();

  const [submitting, setSubmitting] = useState(false);
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFingerprintError(null);
    if (editing) {
      form.setFieldsValue({
        label: editing.label,
        locationType: editing.locationType || 'OFFICE',
        locationId: editing.locationId ?? '',
        gatewayMacs: toText(editing.gatewayMacs),
        bssids: toText(editing.bssids),
        egressIps: toText(editing.egressIps),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ locationType: 'OFFICE' });
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      // AntD has already marked the offending field (the required label); nothing else to do.
      return;
    }

    const gatewayMacs = parseFingerprintList(values.gatewayMacs ?? '');
    const bssids = parseFingerprintList(values.bssids ?? '');
    const egressIps = parseFingerprintList(values.egressIps ?? '');

    // A network the system can never match is not one worth storing — block it here rather than
    // sending a request the backend would (rightly) reject anyway.
    if (gatewayMacs.length === 0 && bssids.length === 0 && egressIps.length === 0) {
      setFingerprintError('Add at least one gateway MAC, BSSID or egress IP');
      return;
    }
    setFingerprintError(null);

    setSubmitting(true);
    // `site`/`userId` are stamped inside the hook (see `saveOfficeNetwork`), so the form supplies
    // only these fields; the hook stamps `site`/`userId` itself and its parameter type is the
    // matching `Omit`, so no cast is needed and a future required field would surface as a real
    // compile error here.
    const payload: Omit<OfficeNetworkSaveRequest, 'site' | 'userId'> = {
      id: editing?.id,
      locationId: values.locationId?.trim() || undefined,
      locationType: values.locationType,
      label: values.label.trim(),
      gatewayMacs,
      bssids,
      egressIps,
    };
    await saveOfficeNetwork(payload);
    setSubmitting(false);

    // The hook clears `store.error` on entry and only sets it on failure, so a null here is the
    // save's success signal — the list is already reloaded and the success toast already shown.
    if (useHrmWorkforceStore.getState().error) return;
    onClose();
  };

  return (
    <Modal
      open={open}
      title={editing ? 'Edit office network' : 'Add office network'}
      okText="Save"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={submitting}
      // A save writes the registry; dismissing it by clicking past the dialog is not an intent.
      maskClosable={false}
      destroyOnClose
      width={520}
    >
      <Form<FormValues> form={form} layout="vertical" className={styles.netFormBody}>
        <Form.Item
          name="label"
          label="Label"
          rules={[{ required: true, whitespace: true, message: 'A label is required' }]}
        >
          <Input placeholder="e.g. HQ — Floor 3" maxLength={120} />
        </Form.Item>

        <Form.Item name="locationType" label="Location type" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'OFFICE', label: 'OFFICE' },
              { value: 'CLIENT', label: 'CLIENT' },
            ]}
          />
        </Form.Item>

        <Form.Item name="locationId" label="Location ID" extra="Optional — ties this fingerprint to one location; leave blank for a site-wide rule.">
          <Input placeholder="Optional" maxLength={120} />
        </Form.Item>

        <Form.Item name="gatewayMacs" label="Gateway MACs" extra="comma or newline separated">
          <TextArea rows={3} autoSize={{ minRows: 2, maxRows: 6 }} placeholder="00:11:22:33:44:55" />
        </Form.Item>

        <Form.Item name="bssids" label="BSSIDs" extra="comma or newline separated">
          <TextArea rows={3} autoSize={{ minRows: 2, maxRows: 6 }} placeholder="a1:b2:c3:d4:e5:f6" />
        </Form.Item>

        <Form.Item name="egressIps" label="Egress IPs" extra="comma or newline separated">
          <TextArea rows={3} autoSize={{ minRows: 2, maxRows: 6 }} placeholder="203.0.113.7" />
        </Form.Item>

        {fingerprintError ? (
          <Alert type="error" showIcon message={fingerprintError} />
        ) : null}
      </Form>
    </Modal>
  );
};

export default OfficeNetworkFormModal;
