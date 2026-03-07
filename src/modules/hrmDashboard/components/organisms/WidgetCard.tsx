'use client';

import { Skeleton } from 'antd';
import { WidgetCardProps } from '../../types/ui.types';
import WidgetDragHandle from '../atoms/WidgetDragHandle';
import styles from '../../styles/Dashboard.module.css';

export default function WidgetCard({ title, loading, children, footerAction, className }: WidgetCardProps) {
  return (
    <div className={`${styles.widgetCard} ${className ?? ''}`}>
      <div className={styles.widgetCardHeader}>
        <span className={styles.widgetCardTitle}>{title}</span>
        <WidgetDragHandle />
      </div>
      <div className={styles.widgetCardBody}>
        {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : children}
      </div>
      {footerAction && (
        <div className={styles.widgetCardFooter}>{footerAction}</div>
      )}
    </div>
  );
}
