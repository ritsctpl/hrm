'use client';

import React, { useMemo } from 'react';
import { Button, Empty, Tag } from 'antd';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { PayComponent, SalaryStructure } from '../../types/domain.types';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import { describeCalculation } from '../../utils/componentCalcLabel';
import { validateEarningsTally } from '../../utils/formulaValidator';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/Compensation.module.css';
import structureStyles from '../../styles/SalaryStructure.module.css';

export interface StructureLine {
  code: string;
  name: string;
  type: PayComponent['componentType'];
  calc: string;
}

/** Resolve each structure line's display name/type/calculation via the pay-component MASTER. */
export function resolveStructureLines(
  structure: Pick<SalaryStructure, 'components'>,
  masters: PayComponent[],
): StructureLine[] {
  const byCode = new Map(masters.map((m) => [m.componentCode, m]));
  return (structure.components ?? []).map((line) => {
    const m = byCode.get(line.componentCode);
    if (!m) {
      return { code: line.componentCode, name: line.componentCode, type: 'EARNING', calc: '—' };
    }
    return {
      code: m.componentCode,
      name: m.componentName,
      type: m.componentType,
      calc: describeCalculation(m),
    };
  });
}

const typeColor = (t: PayComponent['componentType']): string =>
  t === 'EARNING' ? 'green' : t === 'DEDUCTION' ? 'volcano' : 'gold';

interface StructureDetailPanelProps {
  structure: SalaryStructure | null;
  onEdit: (structure: SalaryStructure) => void;
}

const StructureDetailPanel: React.FC<StructureDetailPanelProps> = ({ structure, onEdit }) => {
  const payComponents = useHrmCompensationStore((s) => s.payComponents);

  const lines = useMemo(
    () => (structure ? resolveStructureLines(structure, payComponents) : []),
    [structure, payComponents],
  );

  const tally = useMemo(
    () => (structure ? validateEarningsTally(structure.components ?? [], payComponents) : null),
    [structure, payComponents],
  );

  if (!structure) {
    return (
      <div className={styles.detailEmpty}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a structure to see its components" />
      </div>
    );
  }

  const fillPct = tally ? (tally.hasBalance ? 100 : Math.max(0, Math.min(100, tally.totalPct))) : 0;

  return (
    <div className={styles.structureDetail}>
      <div className={styles.panelHeader}>
        <div className={styles.tableCellStack}>
          <span className={styles.panelTitle}>{structure.structureName}</span>
          <span className={styles.tableCellMuted}>
            {structure.structureCode} · Grade {structure.applicableGrade || '—'}
          </span>
        </div>
        <Can I="edit">
          <Button
            size="small"
            icon={<EditOutlinedIcon style={{ fontSize: 15 }} />}
            onClick={() => onEdit(structure)}
          >
            Edit structure
          </Button>
        </Can>
      </div>

      {lines.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No components in this structure" />
      ) : (
        <ul className={styles.structureLineList}>
          {lines.map((l) => (
            <li key={l.code} className={styles.structureLineRow}>
              <span className={styles.structureLineMain}>
                <span className={styles.tableCellPrimary}>{l.name}</span>
                <span className={styles.tableCellMuted}>{l.code}</span>
              </span>
              <Tag color={typeColor(l.type)} bordered={false}>
                {l.type.replace('_', ' ')}
              </Tag>
              <span className={styles.tableCellMono}>{l.calc}</span>
            </li>
          ))}
        </ul>
      )}

      {tally && (structure.components?.length ?? 0) > 0 && (
        <div className={structureStyles.tallyPanel} data-testid="detail-earnings-tally">
          <div className={structureStyles.tallyHeader}>
            <span className={structureStyles.tallyLabel}>Earnings allocation of CTC</span>
            <span
              className={`${structureStyles.tallyBadge} ${
                tally.balanced ? structureStyles.tallyBadgeBalanced : structureStyles.tallyBadgeUnbalanced
              }`}
            >
              {tally.message}
            </span>
          </div>
          <div className={structureStyles.tallyTrack}>
            <div
              className={`${structureStyles.tallyFill} ${
                tally.balanced ? structureStyles.tallyFillBalanced : structureStyles.tallyFillUnbalanced
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StructureDetailPanel;
