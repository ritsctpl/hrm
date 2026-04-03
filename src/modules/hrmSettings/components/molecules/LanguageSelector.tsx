'use client';

import React from 'react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_OPTIONS } from '../../utils/constants';
import styles from '../../styles/HrmSettings.module.css';
import type { LanguageSelectorProps } from '../../types/ui.types';

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{t('settings.preferences.language')}</label>
      <Select value={currentLanguage} onChange={onLanguageChange} style={{ width: 200 }}>
        {LANGUAGE_OPTIONS.map((opt) => (
          <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default LanguageSelector;
