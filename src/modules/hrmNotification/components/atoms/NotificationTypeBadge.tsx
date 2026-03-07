'use client';

import { getTypeColor, getTypeEmoji } from '../../utils/notificationHelpers';
import styles from '../../styles/NotificationCentre.module.css';

interface NotificationTypeBadgeProps {
  type: string;
}

export default function NotificationTypeBadge({ type }: NotificationTypeBadgeProps) {
  const color = getTypeColor(type);
  const emoji = getTypeEmoji(type);
  return (
    <div
      className={styles.typeBadge}
      style={{ background: `${color}1a` }}
      title={type}
    >
      <span role="img" aria-label={type}>{emoji}</span>
    </div>
  );
}
