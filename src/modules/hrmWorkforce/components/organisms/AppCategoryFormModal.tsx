'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AutoComplete, Form, Input, Modal } from 'antd';
import { useHrmWorkforceData } from '../../hooks/useHrmWorkforceData';
import { useHrmWorkforceStore } from '../../stores/hrmWorkforceStore';
import type { AppCategory, AppCategorySaveRequest } from '../../types/api.types';
import styles from '../../styles/Workforce.module.css';

interface Props {
  open: boolean;
  /** The row being edited, or null/undefined for a fresh create. */
  editing?: AppCategory | null;
  onClose: () => void;
}

/** The form's field values. */
interface FormValues {
  pattern: string;
  category: string;
}

/**
 * Create or edit one app-category rule.
 *
 * <b>Pattern plus a category.</b> Both are required and whitespace-trimmed; the pattern is matched
 * case-insensitively as a substring of the app name. The category is an `AutoComplete` seeded with
 * the categories already in use so an admin reuses an existing bucket rather than spawning a
 * near-duplicate — but free text is allowed, so a genuinely new category is one keystroke away.
 *
 * <b>Success and failure are told apart by the save's own return, not the shared error slot.</b>
 * `saveAppCategory` returns whether the SAVE landed; a post-save list-reload failure stamps
 * `store.error` but the record already landed, so the modal closes on the returned boolean rather
 * than on `store.error` — keeping it open there would invite a duplicate re-submit. The backend's
 * own sentence is already on screen via the hook's `message.error`; this modal invents no wording.
 *
 * <b>Fields are pushed on open, not seeded once.</b> AntD caches `initialValues`, so edit-vs-add and
 * one edited row vs the next are applied with `setFieldsValue` / `resetFields` keyed on the dialog
 * opening — otherwise the second rule edited would wear the first one's values.
 */
const AppCategoryFormModal: React.FC<Props> = ({ open, editing, onClose }) => {
  const [form] = Form.useForm<FormValues>();
  const { saveAppCategory } = useHrmWorkforceData();
  const rows = useHrmWorkforceStore((s) => s.appCategories);

  const [submitting, setSubmitting] = useState(false);

  /** The distinct categories already in use, as AutoComplete options — deduped, first-seen order. */
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { value: string }[] = [];
    for (const row of rows ?? []) {
      const value = (row.category ?? '').trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      out.push({ value });
    }
    return out;
  }, [rows]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        pattern: editing.pattern,
        category: editing.category,
      });
    } else {
      form.resetFields();
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      // AntD has already marked the offending field; nothing else to do.
      return;
    }

    setSubmitting(true);
    // `site`/`userId` are stamped inside the hook (see `saveAppCategory`), so the form supplies only
    // these fields; the hook's parameter type is the matching `Omit`, so no cast is needed and a
    // future required field would surface as a real compile error here.
    const payload: Omit<AppCategorySaveRequest, 'site' | 'userId'> = {
      id: editing?.id,
      pattern: values.pattern.trim(),
      category: values.category.trim(),
    };
    const saved = await saveAppCategory(payload);
    setSubmitting(false);

    // Close on the save's own outcome, not the shared error slot: a post-save list-reload failure
    // stamps `store.error` but the record already landed, so keeping the modal open there would
    // invite a duplicate re-submit.
    if (!saved) return;
    onClose();
  };

  return (
    <Modal
      open={open}
      title={editing ? 'Edit app category' : 'Add app category'}
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
          name="pattern"
          label="Pattern"
          extra="matched case-insensitively as a substring of the app name, e.g. chrome"
          rules={[{ required: true, whitespace: true, message: 'A pattern is required' }]}
        >
          <Input placeholder="e.g. chrome" maxLength={120} />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
          extra="Reuse an existing category, or type a new one."
          rules={[{ required: true, whitespace: true, message: 'A category is required' }]}
        >
          <AutoComplete
            options={categoryOptions}
            placeholder="e.g. Browsing"
            filterOption={(input, option) =>
              (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Input maxLength={120} />
          </AutoComplete>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AppCategoryFormModal;
