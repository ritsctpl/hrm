"use client";

import React from "react";
import styles from "../../styles/NotificationCentre.module.css";

interface ReadIndicatorProps {
  isRead: boolean;
}

const ReadIndicator: React.FC<ReadIndicatorProps> = ({ isRead }) => {
  if (isRead) return null;
  return <span className={styles.unreadDot} />;
};

export default ReadIndicator;
