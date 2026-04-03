'use client';

import React from 'react';
import { Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { RELATIONSHIP_OPTIONS } from '../../utils/constants';
import styles from '../../styles/HrmSettings.module.css';
import type { EmergencyContactFormProps } from '../../types/ui.types';

const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({ data, onChange, errors }) => {
  const { t } = useTranslation();

  const update = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('settings.profile.name')}</label>
        <Input value={data.name} onChange={(e) => update('name', e.target.value)} />
        {errors?.name && <span className={styles.formError}>{errors.name}</span>}
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('settings.profile.relationship')}</label>
        <Select value={data.relationship || undefined} onChange={(v) => update('relationship', v)} placeholder="Select">
          {RELATIONSHIP_OPTIONS.map((r) => (
            <Select.Option key={r} value={r}>{r}</Select.Option>
          ))}
        </Select>
        {errors?.relationship && <span className={styles.formError}>{errors.relationship}</span>}
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('settings.profile.phone')}</label>
        <Input value={data.phone} onChange={(e) => update('phone', e.target.value)} />
        {errors?.phone && <span className={styles.formError}>{errors.phone}</span>}
      </div>
    </div>
  );
};

export default EmergencyContactForm;
