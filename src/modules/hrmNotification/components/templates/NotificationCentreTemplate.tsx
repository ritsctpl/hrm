'use client';

import React from 'react';
import styles from '../../styles/NotificationCentre.module.css';

interface NotificationCentreTemplateProps {
  filtersSlot: React.ReactNode;
  listSlot: React.ReactNode;
}

export default function NotificationCentreTemplate({
  filtersSlot,
  listSlot,
}: NotificationCentreTemplateProps) {
  return (
    <>
      <div className={styles.filters}>{filtersSlot}</div>
      <div className={styles.listWrapper}>
        <div className={styles.listInner}>{listSlot}</div>
      </div>
    </>
  );
}
