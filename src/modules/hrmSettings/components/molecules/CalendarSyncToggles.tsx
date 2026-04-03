'use client';

import React from 'react';
import { Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/HrmSettings.module.css';
import type { CalendarSyncTogglesProps } from '../../types/ui.types';

const CalendarSyncToggles: React.FC<CalendarSyncTogglesProps> = ({ prefs, onToggle }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>
          {t('settings.preferences.googleCalendar')}
          <span className={styles.comingSoonBadge}>{t('settings.preferences.calendarComingSoon')}</span>
        </span>
        <Switch checked={prefs.googleCalendar} onChange={(v) => onToggle('googleCalendar', v)} size="small" />
      </div>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>
          {t('settings.preferences.outlookCalendar')}
          <span className={styles.comingSoonBadge}>{t('settings.preferences.calendarComingSoon')}</span>
        </span>
        <Switch checked={prefs.outlookCalendar} onChange={(v) => onToggle('outlookCalendar', v)} size="small" />
      </div>
    </div>
  );
};

export default CalendarSyncToggles;
