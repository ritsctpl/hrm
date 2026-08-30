'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button, Input, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { SalaryStructure } from '../../types/domain.types';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';

interface StructuresByGradeTableProps {
  onNew: () => void;
}

const StructuresByGradeTable: React.FC<StructuresByGradeTableProps> = ({ onNew }) => {
  const salaryStructures = useHrmCompensationStore((s) => s.salaryStructures);
  const selectedStructure = useHrmCompensationStore((s) => s.selectedStructure);
  const structuresLoading = useHrmCompensationStore((s) => s.structuresLoading);
  const selectStructure = useHrmCompensationStore((s) => s.selectStructure);
  const fetchSalaryStructures = useHrmCompensationStore((s) => s.fetchSalaryStructures);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = !q
      ? salaryStructures
      : salaryStructures.filter(
          (s) =>
            s.structureCode.toLowerCase().includes(q) ||
            s.structureName.toLowerCase().includes(q) ||
            (s.applicableGrade ?? '').toLowerCase().includes(q),
        );
    // Active (current) structures first, then by grade, then name — superseded history sinks below.
    return [...list].sort((a, b) => {
      if ((b.active === 1 ? 1 : 0) !== (a.active === 1 ? 1 : 0)) {
        return (b.active === 1 ? 1 : 0) - (a.active === 1 ? 1 : 0);
      }
      const g = (a.applicableGrade ?? '').localeCompare(b.applicableGrade ?? '');
      return g !== 0 ? g : a.structureName.localeCompare(b.structureName);
    });
  }, [salaryStructures, search]);

  const handleSelect = useCallback(
    (structure: SalaryStructure) => selectStructure(structure),
    [selectStructure],
  );

  const columns: ColumnsType<SalaryStructure> = useMemo(
    () => [
      {
        title: 'Structure',
        key: 'structure',
        render: (_, s) => (
          <div className={styles.tableCellStack}>
            <span className={styles.tableCellPrimary}>{s.structureName}</span>
            <span className={styles.tableCellMuted}>{s.structureCode}</span>
          </div>
        ),
      },
      {
        title: 'Grade',
        dataIndex: 'applicableGrade',
        key: 'grade',
        width: 110,
        render: (g: string) => (g ? <Tag bordered={false}>{g}</Tag> : <span className={styles.tableCellMuted}>—</span>),
      },
      {
        title: 'Components',
        key: 'components',
        width: 110,
        align: 'center',
        render: (_, s) => <span>{s.components?.length ?? 0}</span>,
      },
      {
        title: 'Employees',
        key: 'employees',
        width: 110,
        align: 'center',
        // No org-wide employee-compensation-by-structure count endpoint exists — show a dash
        // rather than fabricate a number.
        render: () => <span className={styles.tableCellMuted}>—</span>,
      },
      {
        title: 'Status',
        key: 'status',
        width: 110,
        render: (_, s) => (
          <Tag color={s.active === 1 ? 'green' : 'default'} bordered={false}>
            {s.active === 1 ? 'Current' : 'Superseded'}
          </Tag>
        ),
      },
    ],
    [],
  );

  return (
    <div className={styles.tablePage}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Structures by grade</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<RefreshIcon style={{ fontSize: 14 }} />}
            onClick={() => fetchSalaryStructures()}
          />
          <Can I="add">
            <Button type="primary" size="small" icon={<AddIcon style={{ fontSize: 14 }} />} onClick={onNew}>
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
      ) : (
        <Table<SalaryStructure>
          rowKey="structureCode"
          size="small"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          onRow={(record) => ({ onClick: () => handleSelect(record) })}
          rowClassName={(record) => {
            const base =
              record.structureCode === selectedStructure?.structureCode
                ? styles.tableRowSelected
                : styles.tableRowClickable;
            return record.active === 1 ? base : `${base} ${styles.tableRowMuted}`;
          }}
          locale={{ emptyText: 'No structures found' }}
        />
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--hrm-text-tertiary)' }}>
        {filtered.length} of {salaryStructures.length} structures
      </div>
    </div>
  );
};

export default StructuresByGradeTable;
