'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/HrmSettings.module.css';

const QuickLinks: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <a href="#" className={styles.quickLink}>
        <FileText size={16} />
        {t('settings.support.privacyPolicy')}
      </a>
      <a href="#" className={styles.quickLink}>
        <FileText size={16} />
        {t('settings.support.termsOfService')}
      </a>
    </div>
  );
};

export default QuickLinks;
