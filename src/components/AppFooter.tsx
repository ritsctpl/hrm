'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHrmRbacStore } from '@modules/hrmAccess/stores/hrmRbacStore';
import styles from './AppFooter.module.css';

const AppFooter: React.FC = () => {
  const { t } = useTranslation();
  const currentOrganizationId = useHrmRbacStore(s => s.currentOrganizationId);
  const organizations = useHrmRbacStore(s => s.organizations);
  const orgDisplayName =
    organizations.find(o => o.site === currentOrganizationId)?.organizationName || currentOrganizationId || '';

  return (
    <footer className={styles.footer}>
      {orgDisplayName && (
        <>
          <span title={orgDisplayName}>{orgDisplayName}</span>
          <span className={styles.separator}>|</span>
        </>
      )}
      <span>{t('nav.footer.version')}</span>
      <span className={styles.separator}>|</span>
      <span>{t('nav.footer.copyright')}</span>
      <span className={styles.separator}>|</span>
      <a href="#" className={styles.helpLink}>{t('nav.footer.helpCenter')} ↗</a>
    </footer>
  );
};

export default AppFooter;
