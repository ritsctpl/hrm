'use client';

import React from 'react';
import { Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import OrgBankAccountCard from './OrgBankAccountCard';
import type { OrgBankAccountListProps } from '../../types/ui.types';
import styles from '../../styles/HrmOrganization.module.css';

const OrgBankAccountList: React.FC<OrgBankAccountListProps> = ({
  accounts,
  onAdd,
  onEdit,
  onDelete,
  onSetPrimary,
  disabled = false,
}) => {
  return (
    <div>
      <div className={styles.listHeader}>
        {!disabled && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} size="small">
            Add Account
          </Button>
        )}
      </div>
      {accounts.length === 0 ? (
        <Empty description="No bank accounts added" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {accounts.map((account, index) => (
            <OrgBankAccountCard
              key={`${account.accountNumber}-${index}`}
              bankName={account.bankName}
              branchName={account.branchName || account.branch}
              accountNumber={account.accountNumber}
              ifscCode={account.ifscCode || account.ifsc}
              accountType={account.accountType}
              isPrimary={account.isPrimary}
              onEdit={() => onEdit(index)}
              onDelete={() => onDelete(index)}
              onSetPrimary={() => onSetPrimary(index)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgBankAccountList;
