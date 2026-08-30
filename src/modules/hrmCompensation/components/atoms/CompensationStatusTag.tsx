'use client';

import React from 'react';
import type { CompensationStatusTagProps } from '../../types/ui.types';
import styles from '../../styles/Compensation.module.css';

/** Semantic, token-driven status pill — readable in light and dark. */
const STATUS_CLASS: Record<string, string> = {
  DRAFT: styles.statusDraft,
  SUBMITTED: styles.statusSubmitted,
  APPROVED: styles.statusApproved,
  REJECTED: styles.statusRejected,
  PENDING: styles.statusPending,
};

const CompensationStatusTag: React.FC<CompensationStatusTagProps> = ({ status }) => {
  const cls = STATUS_CLASS[status] ?? styles.statusDraft;
  return <span className={`${styles.statusTag} ${cls}`}>{status}</span>;
};

export default CompensationStatusTag;
