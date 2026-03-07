'use client';

import type { ReactNode } from 'react';
import styles from '../../styles/HrmHoliday.module.css';

interface HolidaysMasterDetailProps {
  children: [ReactNode, ReactNode];
}

export default function HolidaysMasterDetail({ children }: HolidaysMasterDetailProps) {
  const [leftPanel, rightPanel] = children;
  return (
    <div className={styles.masterDetail}>
      <div className={styles.leftPanel}>{leftPanel}</div>
      <div className={styles.rightPanel}>{rightPanel}</div>
    </div>
  );
}
