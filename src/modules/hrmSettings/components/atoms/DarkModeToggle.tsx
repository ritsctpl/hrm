'use client';

import React from 'react';
import { Switch } from 'antd';
import { Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/HrmSettings.module.css';
import type { DarkModeToggleProps } from '../../types/ui.types';

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ checked, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.toggleRow}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Moon size={16} />
        <span className={styles.toggleLabel}>{t('settings.preferences.darkMode')}</span>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
};

export default DarkModeToggle;
