'use client';

import React from 'react';
import { Button, Empty } from 'antd';
import AddIcon from '@mui/icons-material/Add';
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
        <span className={styles.listTitle}>Bank Accounts</span>
        {!disabled && (
          <Button type="primary" icon={<AddIcon fontSize="small" />} onClick={onAdd} size="small">
            Add Account
          </Button>
        )}
      </div>
      {accounts.length === 0 ? (
        <Empty description="No bank accounts added" />
      ) : (
        <div className={styles.bankCardList}>
          {accounts.map((account, index) => (
            <OrgBankAccountCard
              key={`${account.accountNumber}-${index}`}
              bankName={account.bankName}
              branchName={account.branchName}
              accountNumber={account.accountNumber}
              ifscCode={account.ifscCode}
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
