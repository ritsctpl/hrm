'use client';

import React from 'react';
import { Switch, TimePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import styles from '../../styles/HrmSettings.module.css';
import type { DndScheduleProps } from '../../types/ui.types';

const DndSchedule: React.FC<DndScheduleProps> = ({
  enabled, startTime, endTime, onToggle, onStartTimeChange, onEndTimeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>{t('settings.notifications.dnd')}</span>
        <Switch checked={enabled} onChange={onToggle} size="small" />
      </div>
      {enabled && (
        <div className={styles.dndTimeRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.notifications.dndStartTime')}</label>
            <TimePicker
              value={startTime ? dayjs(startTime, 'HH:mm') : null}
              onChange={(_, timeString) => onStartTimeChange(timeString as string || null)}
              format="HH:mm"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('settings.notifications.dndEndTime')}</label>
            <TimePicker
              value={endTime ? dayjs(endTime, 'HH:mm') : null}
              onChange={(_, timeString) => onEndTimeChange(timeString as string || null)}
              format="HH:mm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DndSchedule;
