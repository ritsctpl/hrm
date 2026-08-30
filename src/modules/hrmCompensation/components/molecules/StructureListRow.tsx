'use client';

import React from 'react';
import type { SalaryStructure } from '../../types/domain.types';
import styles from '../../styles/SalaryStructure.module.css';

interface StructureListRowProps {
  structure: SalaryStructure;
  selected: boolean;
  onClick: () => void;
}

const StructureListRow: React.FC<StructureListRowProps> = ({
  structure,
  selected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`${styles.structureRow} ${selected ? styles.structureRowSelected : ''}`}
    >
      <div className={styles.structureCodeLine}>
        <span className={styles.structureCode}>{structure.structureCode}</span>
        <span className={styles.structureGrade}>{structure.applicableGrade}</span>
      </div>
      <div className={styles.structureName}>{structure.structureName}</div>
      <div className={styles.structureMeta}>
        {structure.components?.length ?? 0} components
      </div>
    </div>
  );
};

export default StructureListRow;
