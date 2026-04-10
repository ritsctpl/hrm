'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button, Input, Spin, Typography } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SalaryStructure } from '../../types/domain.types';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import StructureListRow from '../molecules/StructureListRow';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';

const SalaryStructureList: React.FC = () => {
  const salaryStructures = useHrmCompensationStore((s) => s.salaryStructures);
  const selectedStructure = useHrmCompensationStore((s) => s.selectedStructure);
  const structuresLoading = useHrmCompensationStore((s) => s.structuresLoading);
  const selectStructure = useHrmCompensationStore((s) => s.selectStructure);
  const fetchSalaryStructures = useHrmCompensationStore((s) => s.fetchSalaryStructures);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return salaryStructures;
    return salaryStructures.filter(
      (s) =>
        s.structureCode.toLowerCase().includes(q) ||
        s.structureName.toLowerCase().includes(q) ||
        s.applicableGrade.toLowerCase().includes(q),
    );
  }, [salaryStructures, search]);

  const handleNew = useCallback(() => {
    selectStructure(null);
  }, [selectStructure]);

  const handleSelect = useCallback(
    (structure: SalaryStructure) => {
      selectStructure(structure);
    },
    [selectStructure],
  );

  return (
    <div>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Salary Structures</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<RefreshIcon style={{ fontSize: 14 }} />}
            onClick={() => fetchSalaryStructures()}
          />
          <Can I="add">
            <Button
              type="primary"
              size="small"
              icon={<AddIcon style={{ fontSize: 14 }} />}
              onClick={handleNew}
            >
              New
            </Button>
          </Can>
        </div>
      </div>

      <Input.Search
        placeholder="Search structures..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="small"
        style={{ marginBottom: 12 }}
      />

      {structuresLoading ? (
        <div className={styles.loadingContainer}>
          <Spin />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyContainer}>
          <Typography.Text type="secondary">No structures found</Typography.Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((structure) => (
            <StructureListRow
              key={structure.structureCode}
              structure={structure}
              selected={selectedStructure?.structureCode === structure.structureCode}
              onClick={() => handleSelect(structure)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
        {filtered.length} of {salaryStructures.length} structures
      </div>
    </div>
  );
};

export default SalaryStructureList;
