'use client';

import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { parseCookies } from 'nookies';
import { Lock } from 'lucide-react';
import PasswordStrengthBar from '../atoms/PasswordStrengthBar';
import api from '@/services/api';
import styles from '../../styles/HrmSettings.module.css';

// Mirrors the backend Keycloak password policy (KeycloakAdminClient.validatePasswordPolicy)
const policyOk = (p: string) =>
  p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);

const ChangePasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const username = parseCookies().userId || '';
    if (!username) {
      message.error('Could not determine the current user. Please re-login.');
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      message.error('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('New password and confirmation do not match.');
      return;
    }
    if (!policyOk(newPassword)) {
      message.error('Password must be 8+ chars with upper, lower, digit and special character.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/hrm-service/account/change-password', {
        username,
        currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        message.success('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        message.error(res.data?.message || 'Failed to change password.');
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('settings.security.currentPassword')}</label>
          <Input.Password
            prefix={<Lock size={14} />}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('settings.security.newPassword')}</label>
          <Input.Password
            prefix={<Lock size={14} />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('settings.security.confirmPassword')}</label>
          <Input.Password
            prefix={<Lock size={14} />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>
      <PasswordStrengthBar password={newPassword} />
      <div style={{ marginTop: 16 }}>
        <Button type="primary" loading={submitting} onClick={handleSubmit}>
          {t('settings.security.changePassword', 'Change Password')}
        </Button>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
