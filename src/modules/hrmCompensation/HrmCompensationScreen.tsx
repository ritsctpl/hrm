'use client';

import React, { useEffect } from 'react';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import EmployeeCompensationForm from './components/organisms/EmployeeCompensationForm';
import { useHrmCompensationStore } from './stores/compensationStore';
import styles from './styles/Compensation.module.css';

interface HrmCompensationScreenProps {
  employeeId: string;
  onBack: () => void;
}

const HrmCompensationScreen: React.FC<HrmCompensationScreenProps> = ({
  employeeId,
  onBack,
}) => {
  const loadEmployeeCompensation = useHrmCompensationStore((s) => s.loadEmployeeCompensation);
  const fetchCompensationHistory = useHrmCompensationStore((s) => s.fetchCompensationHistory);
  const setSelectedEmployeeId = useHrmCompensationStore((s) => s.setSelectedEmployeeId);
  const fetchPayComponents = useHrmCompensationStore((s) => s.fetchPayComponents);
  const fetchSalaryStructures = useHrmCompensationStore((s) => s.fetchSalaryStructures);

  useEffect(() => {
    setSelectedEmployeeId(employeeId);
    fetchPayComponents();
    fetchSalaryStructures();
    loadEmployeeCompensation(employeeId);
    fetchCompensationHistory(employeeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <div className={styles.compensationScreen}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          size="small"
        />
        <Typography.Title level={5} style={{ margin: 0 }}>
          Employee Compensation
        </Typography.Title>
      </div>
      <EmployeeCompensationForm />
    </div>
  );
};

export default HrmCompensationScreen;
