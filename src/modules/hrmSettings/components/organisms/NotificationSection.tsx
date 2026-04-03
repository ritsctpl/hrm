'use client';

import React from 'react';
import { Button, message } from 'antd';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NotificationToggleGroup from '../molecules/NotificationToggleGroup';
import DndSchedule from '../molecules/DndSchedule';
import { useHrmSettingsStore } from '../../stores/hrmSettingsStore';
import styles from '../../styles/HrmSettings.module.css';

const NotificationSection: React.FC = () => {
  const { t } = useTranslation();
  const { notificationPrefs, updatePushToggle, updateEmailToggle, setNotificationPrefs } = useHrmSettingsStore();

  const pushToggles = [
    { key: 'salaryCredit', label: t('settings.notifications.salaryCredit'), checked: notificationPrefs.push.salaryCredit },
    { key: 'leaveApproval', label: t('settings.notifications.leaveApproval'), checked: notificationPrefs.push.leaveApproval },
    { key: 'generalAnnouncements', label: t('settings.notifications.generalAnnouncements'), checked: notificationPrefs.push.generalAnnouncements },
    { key: 'holidayAlerts', label: t('settings.notifications.holidayAlerts'), checked: notificationPrefs.push.holidayAlerts },
    { key: 'appraisalUpdates', label: t('settings.notifications.appraisalUpdates'), checked: notificationPrefs.push.appraisalUpdates },
  ];

  const emailToggles = [
    { key: 'payslipAvailable', label: t('settings.notifications.payslipAvailable'), checked: notificationPrefs.email.payslipAvailable },
    { key: 'policyUpdates', label: t('settings.notifications.policyUpdates'), checked: notificationPrefs.email.policyUpdates },
    { key: 'expenseApproval', label: t('settings.notifications.expenseApproval'), checked: notificationPrefs.email.expenseApproval },
    { key: 'projectAssignments', label: t('settings.notifications.projectAssignments'), checked: notificationPrefs.email.projectAssignments },
  ];

  const handleDndToggle = (enabled: boolean) => {
    setNotificationPrefs({ ...notificationPrefs, dnd: { ...notificationPrefs.dnd, enabled } });
  };

  const handleSave = () => {
    message.success('Notification preferences saved');
  };

  return (
    <div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <Bell size={20} strokeWidth={1.5} />
          <div>
            <h2 className={styles.sectionTitle}>{t('settings.notifications.title')}</h2>
          </div>
        </div>

        <NotificationToggleGroup title={t('settings.notifications.push')} toggles={pushToggles} onToggle={updatePushToggle} />

        <div className={styles.subSection}>
          <NotificationToggleGroup title={t('settings.notifications.email')} toggles={emailToggles} onToggle={updateEmailToggle} />
        </div>

        <div className={styles.subSection}>
          <DndSchedule
            enabled={notificationPrefs.dnd.enabled}
            startTime={notificationPrefs.dnd.startTime}
            endTime={notificationPrefs.dnd.endTime}
            onToggle={handleDndToggle}
            onStartTimeChange={(time) => setNotificationPrefs({ ...notificationPrefs, dnd: { ...notificationPrefs.dnd, startTime: time } })}
            onEndTimeChange={(time) => setNotificationPrefs({ ...notificationPrefs, dnd: { ...notificationPrefs.dnd, endTime: time } })}
          />
        </div>

        <Button type="primary" onClick={handleSave} className={styles.saveButton}>
          {t('settings.notifications.savePreferences')}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSection;
