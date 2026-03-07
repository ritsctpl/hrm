'use client';

import styles from '../../styles/NotificationCentre.module.css';

interface NotificationDotProps {
  visible: boolean;
}

export default function NotificationDot({ visible }: NotificationDotProps) {
  if (!visible) return <div style={{ width: 8 }} />;
  return <div className={styles.unreadDot} />;
}
