'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AppFooter.module.css';

const AppFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <span>{t('nav.footer.version')}</span>
      <span className={styles.separator}>|</span>
      <span>{t('nav.footer.copyright')}</span>
      <span className={styles.separator}>|</span>
      <a href="#" className={styles.helpLink}>{t('nav.footer.helpCenter')} ↗</a>
    </footer>
  );
};

export default AppFooter;
