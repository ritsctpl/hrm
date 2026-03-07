'use client';

import React, { useEffect } from 'react';
import { Typography } from 'antd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CompensationTabLayout from './components/templates/CompensationTabLayout';
import { useHrmCompensationStore } from './stores/compensationStore';
import styles from './styles/Compensation.module.css';

const HrmCompensationLanding: React.FC = () => {
  const fetchPayComponents = useHrmCompensationStore((s) => s.fetchPayComponents);
  const fetchSalaryStructures = useHrmCompensationStore((s) => s.fetchSalaryStructures);
  const reset = useHrmCompensationStore((s) => s.reset);

  useEffect(() => {
    fetchPayComponents();
    fetchSalaryStructures();
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.compensationPage}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}
      >
        <AccountBalanceWalletIcon style={{ fontSize: 22, color: '#1677ff' }} />
        <Typography.Title level={5} style={{ margin: 0 }}>
          Compensation Management
        </Typography.Title>
      </div>
      <div className={styles.tabsWrapper}>
        <CompensationTabLayout />
      </div>
    </div>
  );
};

export default HrmCompensationLanding;
