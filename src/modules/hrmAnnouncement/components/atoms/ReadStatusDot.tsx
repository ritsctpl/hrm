"use client";

import React from "react";
import { Tooltip } from "antd";
import styles from "../../styles/HrmAnnouncement.module.css";

interface ReadStatusDotProps {
  isRead?: boolean;
}

const ReadStatusDot: React.FC<ReadStatusDotProps> = ({ isRead }) => {
  if (isRead) return null;
  return (
    <Tooltip title="Unread">
      <span className={styles.unreadDot} />
    </Tooltip>
  );
};

export default ReadStatusDot;
