'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/HrmSettings.module.css';
import type { SessionInfoProps } from '../../types/ui.types';

const SessionInfo: React.FC<SessionInfoProps> = ({ lastLogin, loginMethod }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className={styles.sessionInfoRow}>
        <span className={styles.sessionLabel}>{t('settings.security.lastLogin')}</span>
        <span className={styles.sessionValue}>{lastLogin || 'N/A'}</span>
      </div>
      <div className={styles.sessionInfoRow}>
        <span className={styles.sessionLabel}>{t('settings.security.loginMethod')}</span>
        <span className={styles.sessionValue}>{loginMethod}</span>
      </div>
    </div>
  );
};

export default SessionInfo;
