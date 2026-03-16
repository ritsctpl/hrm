'use client';

import React, { useState } from 'react';
import { Button, Tag, Tooltip, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, StarFilled, StarOutlined, EyeOutlined } from '@ant-design/icons';
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
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  const maskedAccount =
    accountNumber.length > 4
      ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
      : accountNumber;

  return (
    <>
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
            <Tooltip title="View details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setDetailsModalOpen(true)}
              />
            </Tooltip>
            {!isPrimary && !disabled && (
              <Tooltip title="Set as primary">
                <Button
                  type="text"
                  size="small"
                  icon={<StarOutlined />}
                  onClick={onSetPrimary}
                />
              </Tooltip>
            )}
            {isPrimary && (
              <Tooltip title="Primary account">
                <StarFilled style={{ color: '#1890ff' }} />
              </Tooltip>
            )}
            {!disabled && (
              <>
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={onEdit}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
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
            <div className={styles.bankCardValue}>{branchName || '-'}</div>
          </div>
          <div>
            <div className={styles.bankCardLabel}>Account No.</div>
            <div className={styles.bankCardValue}>{maskedAccount}</div>
          </div>
          <div>
            <div className={styles.bankCardLabel}>IFSC Code</div>
            <div className={styles.bankCardValue}>{ifscCode || '-'}</div>
          </div>
          <div>
            <div className={styles.bankCardLabel}>Account Type</div>
            <div className={styles.bankCardValue}>{accountType}</div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        title={`${bankName} - Account Details`}
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Bank Name</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f1f1f' }}>{bankName}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Branch</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f1f1f' }}>{branchName || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Account Number</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f1f1f' }}>{accountNumber}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>IFSC Code</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f1f1f' }}>{ifscCode || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Account Type</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f1f1f' }}>{accountType}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Primary Account</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f1f1f' }}>
              {isPrimary ? (
                <Tag color="blue">Yes</Tag>
              ) : (
                <Tag>No</Tag>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OrgBankAccountCard;
