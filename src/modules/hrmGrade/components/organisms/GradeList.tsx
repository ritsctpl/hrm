'use client';

import React, { useMemo, useState } from 'react';
import { Button, Input, Spin, Typography } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { Grade } from '../../types/domain.types';
import { useHrmGradeStore } from '../../stores/gradeStore';
import GradeListRow from '../molecules/GradeListRow';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Grade.module.css';

const GradeList: React.FC = () => {
  const grades = useHrmGradeStore((s) => s.grades);
  const selectedGrade = useHrmGradeStore((s) => s.selectedGrade);
  const loading = useHrmGradeStore((s) => s.loading);
  const selectGrade = useHrmGradeStore((s) => s.selectGrade);
  const fetchGrades = useHrmGradeStore((s) => s.fetchGrades);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return grades;
    return grades.filter(
      (g: Grade) =>
        g.gradeCode.toLowerCase().includes(q) ||
        g.gradeName.toLowerCase().includes(q) ||
        g.track.toLowerCase().includes(q),
    );
  }, [grades, search]);

  return (
    <div>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Grades</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<RefreshIcon style={{ fontSize: 14 }} />}
            onClick={() => fetchGrades()}
          />
          <Can I="add" object="grade_master">
            <Button
              type="primary"
              size="small"
              icon={<AddIcon style={{ fontSize: 14 }} />}
              onClick={() => selectGrade(null)}
            >
              New
            </Button>
          </Can>
        </div>
      </div>

      <Input.Search
        placeholder="Search grades..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="small"
        style={{ marginBottom: 12 }}
      />

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyContainer}>
          <Typography.Text type="secondary">No grades found</Typography.Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((grade) => (
            <GradeListRow
              key={grade.gradeCode}
              grade={grade}
              selected={selectedGrade?.gradeCode === grade.gradeCode}
              onClick={() => selectGrade(grade)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
        {filtered.length} of {grades.length} grades
      </div>
    </div>
  );
};

export default GradeList;
