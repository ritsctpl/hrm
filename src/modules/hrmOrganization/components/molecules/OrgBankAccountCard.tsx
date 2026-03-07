'use client';

import React from 'react';
import { Button, Tag, Tooltip } from 'antd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import type { OrgBankAccountCardProps } from '../../types/ui.types';
import styles from '../../styles/HrmOrganization.module.css';

const OrgBankAccountCard: React.FC<OrgBankAccountCardProps> = ({
  bankName,
  branchName,
  accountNumber,
  ifscCode,
  accountType,
  isPrimary,
  onEdit,
  onDelete,
  onSetPrimary,
  disabled = false,
}) => {
  const maskedAccount =
    accountNumber.length > 4
      ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
      : accountNumber;

  return (
    <div className={`${styles.bankCard} ${isPrimary ? styles.primary : ''}`}>
      <div className={styles.bankCardHeader}>
        <div className={styles.bankCardTitle}>
          {bankName}
          {isPrimary && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              Primary
            </Tag>
          )}
        </div>
        <div className={styles.bankCardActions}>
          {!isPrimary && !disabled && (
            <Tooltip title="Set as primary">
              <Button
                type="text"
                size="small"
                icon={<StarBorderIcon fontSize="small" />}
                onClick={onSetPrimary}
              />
            </Tooltip>
          )}
          {isPrimary && (
            <Tooltip title="Primary account">
              <StarIcon fontSize="small" style={{ color: '#1890ff' }} />
            </Tooltip>
          )}
          {!disabled && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditIcon fontSize="small" />}
                  onClick={onEdit}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteIcon fontSize="small" />}
                  onClick={onDelete}
                />
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <div className={styles.bankCardGrid}>
        <div>
          <div className={styles.bankCardLabel}>Branch</div>
          <div className={styles.bankCardValue}>{branchName}</div>
        </div>
        <div>
          <div className={styles.bankCardLabel}>Account No.</div>
          <div className={styles.bankCardValue}>{maskedAccount}</div>
        </div>
        <div>
          <div className={styles.bankCardLabel}>IFSC Code</div>
          <div className={styles.bankCardValue}>{ifscCode}</div>
        </div>
        <div>
          <div className={styles.bankCardLabel}>Account Type</div>
          <div className={styles.bankCardValue}>{accountType}</div>
        </div>
      </div>
    </div>
  );
};

export default OrgBankAccountCard;
