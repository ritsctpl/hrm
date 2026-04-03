'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChangePasswordForm from '../molecules/ChangePasswordForm';
import SessionInfo from '../molecules/SessionInfo';
import { useSettingsData } from '../../hooks/useSettingsData';
import styles from '../../styles/HrmSettings.module.css';

const SecuritySection: React.FC = () => {
  const { t } = useTranslation();
  const { lastLogin } = useSettingsData();

  return (
    <div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <Shield size={20} strokeWidth={1.5} />
          <div>
            <h2 className={styles.sectionTitle}>{t('settings.security.title')}</h2>
          </div>
        </div>

        <h4 className={styles.subSectionTitle}>{t('settings.security.changePassword')}</h4>
        <ChangePasswordForm />

        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>{t('settings.security.sessionInfo')}</h4>
          <SessionInfo lastLogin={lastLogin} loginMethod="Keycloak SSO" />
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
