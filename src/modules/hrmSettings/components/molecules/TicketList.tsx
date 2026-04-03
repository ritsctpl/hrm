'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/HrmSettings.module.css';
import type { TicketListProps } from '../../types/ui.types';

const TicketList: React.FC<TicketListProps> = ({ tickets }) => {
  const { t } = useTranslation();

  if (tickets.length === 0) {
    return <div className={styles.emptyState}>{t('settings.support.noTickets')}</div>;
  }

  return (
    <div>
      {tickets.map((ticket) => (
        <div key={ticket.id} className={styles.ticketRow}>
          <span className={styles.ticketId}>#{ticket.id}</span>
          <span className={styles.ticketSubject}>{ticket.subject}</span>
          <span className={`${styles.ticketStatus} ${ticket.status === 'pending' ? styles.ticketPending : styles.ticketResolved}`}>
            {ticket.status}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TicketList;
