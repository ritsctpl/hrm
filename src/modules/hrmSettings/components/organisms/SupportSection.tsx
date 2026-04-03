'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TicketForm from '../molecules/TicketForm';
import TicketList from '../molecules/TicketList';
import QuickLinks from '../atoms/QuickLinks';
import { useHrmSettingsStore } from '../../stores/hrmSettingsStore';
import type { SupportTicket } from '../../types/domain.types';
import styles from '../../styles/HrmSettings.module.css';

const SupportSection: React.FC = () => {
  const { t } = useTranslation();
  const { tickets, addTicket } = useHrmSettingsStore();

  const handleSubmit = (data: { subject: string; category: string; description: string; priority: 'low' | 'medium' | 'high' }) => {
    const ticket: SupportTicket = {
      ...data,
      id: String(Date.now()).slice(-6),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    addTicket(ticket);
  };

  return (
    <div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <HelpCircle size={20} strokeWidth={1.5} />
          <div>
            <h2 className={styles.sectionTitle}>{t('settings.support.title')}</h2>
          </div>
        </div>

        <h4 className={styles.subSectionTitle}>{t('settings.support.submitTicket')}</h4>
        <TicketForm onSubmit={handleSubmit} />

        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>{t('settings.support.myTickets')}</h4>
          <TicketList tickets={tickets} />
        </div>

        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>{t('settings.support.quickLinks')}</h4>
          <QuickLinks />
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
