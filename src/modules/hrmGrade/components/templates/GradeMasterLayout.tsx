'use client';

import React from 'react';
import GradeList from '../organisms/GradeList';
import GradeForm from '../organisms/GradeForm';
import styles from '../../styles/Grade.module.css';

/** Master-detail layout: grade list on the left, editor on the right. */
const GradeMasterLayout: React.FC = () => (
  <div className={styles.masterDetailGrid}>
    <div className={styles.masterPanel}>
      <GradeList />
    </div>
    <div className={styles.detailPanel}>
      <GradeForm />
    </div>
  </div>
);

export default GradeMasterLayout;
