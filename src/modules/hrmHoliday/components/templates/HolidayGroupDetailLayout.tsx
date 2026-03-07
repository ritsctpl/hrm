'use client';

import type { ReactNode } from 'react';
import styles from '../../styles/HolidayDetail.module.css';

interface HolidayGroupDetailLayoutProps {
  children: ReactNode;
}

export default function HolidayGroupDetailLayout({ children }: HolidayGroupDetailLayoutProps) {
  return <div className={styles.detailLayout}>{children}</div>;
}
