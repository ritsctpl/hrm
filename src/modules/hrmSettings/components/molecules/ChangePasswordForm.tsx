'use client';

import React, { useState } from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { Lock, Info } from 'lucide-react';
import PasswordStrengthBar from '../atoms/PasswordStrengthBar';
import styles from '../../styles/HrmSettings.module.css';

const ChangePasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');

  return (
    <div>
      <div className={styles.comingSoonBanner}>
        <Info size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        {t('settings.security.comingSoonDesc')}
        <span className={styles.comingSoonBadge}>{t('settings.security.comingSoon')}</span>
      </div>
      <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.security.currentPassword')}</label>
            <Input.Password prefix={<Lock size={14} />} disabled />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.security.newPassword')}</label>
            <Input.Password
              prefix={<Lock size={14} />}
              disabled
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.security.confirmPassword')}</label>
            <Input.Password prefix={<Lock size={14} />} disabled />
          </div>
        </div>
        <PasswordStrengthBar password={newPassword} />
      </div>
    </div>
  );
};

export default ChangePasswordForm;
