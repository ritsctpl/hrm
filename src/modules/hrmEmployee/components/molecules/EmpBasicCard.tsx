/**
 * EmpBasicCard - Card view item for an employee in the directory grid
 */

'use client';

import React from 'react';
import {
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import EmpAvatar from '../atoms/EmpAvatar';
import EmpStatusBadge from '../atoms/EmpStatusBadge';
import type { EmpBasicCardProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const EmpBasicCard: React.FC<EmpBasicCardProps> = ({ employee, onClick }) => {
  return (
    <div
      className={styles.empCard}
      onClick={() => onClick(employee.handle)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(employee.handle);
      }}
    >
      <div className={styles.empCardStatus}>
        <EmpStatusBadge status={employee.status} size="small" />
      </div>

      <EmpAvatar
        name={employee.fullName}
        photoUrl={employee.photoUrl}
        size={52}
      />

      <div className={styles.empCardName}>{employee.fullName}</div>
      <div className={styles.empCardRole}>{employee.designation}</div>

      <div className={styles.empCardDetails}>
        <div className={styles.empCardDetailRow}>
          <UserOutlined />
          <span>{employee.employeeCode}</span>
        </div>
        <div className={styles.empCardDetailRow}>
          <TeamOutlined />
          <span>{employee.department}</span>
        </div>
        <div className={styles.empCardDetailRow}>
          <MailOutlined />
          <span>{employee.workEmail}</span>
        </div>
      </div>
    </div>
  );
};

export default EmpBasicCard;
