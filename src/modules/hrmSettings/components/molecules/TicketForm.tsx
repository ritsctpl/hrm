'use client';

import React, { useState } from 'react';
import { Input, Select, Radio, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ticketFormSchema } from '../../types/domain.types';
import { TICKET_CATEGORIES } from '../../utils/constants';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HrmSettings.module.css';
import type { TicketFormProps } from '../../types/ui.types';

const TicketForm: React.FC<TicketFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ subject: '', category: '', description: '', priority: 'medium' as const });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const result = ticketFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
    setForm({ subject: '', category: '', description: '', priority: 'medium' });
    message.success('Ticket submitted successfully');
  };

  return (
    <div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('settings.support.subject')}</label>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          {errors.subject && <span className={styles.formError}>{errors.subject}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('settings.support.category')}</label>
          <Select value={form.category || undefined} onChange={(v) => setForm({ ...form, category: v })} placeholder="Select">
            {TICKET_CATEGORIES.map((c) => (
              <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>
            ))}
          </Select>
          {errors.category && <span className={styles.formError}>{errors.category}</span>}
        </div>
      </div>
      <div className={styles.formGroup} style={{ marginTop: 16 }}>
        <label className={styles.formLabel}>{t('settings.support.description')}</label>
        <Input.TextArea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {errors.description && <span className={styles.formError}>{errors.description}</span>}
      </div>
      <div className={styles.formGroup} style={{ marginTop: 16 }}>
        <label className={styles.formLabel}>{t('settings.support.priority')}</label>
        <Radio.Group value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <Radio value="low">Low</Radio>
          <Radio value="medium">Medium</Radio>
          <Radio value="high">High</Radio>
        </Radio.Group>
      </div>
      <Can I="add">
        <Button type="primary" onClick={handleSubmit} className={styles.saveButton}>
          {t('settings.support.submit')}
        </Button>
      </Can>
    </div>
  );
};

export default TicketForm;
