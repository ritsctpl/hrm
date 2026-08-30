'use client';

import React from 'react';
import { Badge, Tooltip } from 'antd';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { CompensationTabKey } from '../../types/ui.types';
import styles from '../../styles/Compensation.module.css';

/**
 * Which store slice supplies the live count shown next to a step.
 * Kept as a string key (not a selector fn) so the WORKFLOW_STEPS array stays
 * pure/serialisable and unit-testable without pulling the store in.
 */
export type WorkflowCountKey = 'payComponents' | 'salaryStructures' | 'pendingApprovals';

export interface WorkflowStep {
  key: CompensationTabKey;
  /** 0 = Overview landing; 1..6 = the guided pipeline steps. */
  index: number;
  label: string;
  /** Short helper shown under the label. */
  hint: string;
  /** Store array whose length is shown as a live count chip, if any. */
  countKey?: WorkflowCountKey;
}

/**
 * The guided workflow — the single source of truth for the left rail order,
 * labels and count bindings. Pure data: no React, no store. Unit-tested.
 */
export const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: 'overview', index: 0, label: 'Overview', hint: 'Pipeline & activity' },
  { key: 'components', index: 1, label: 'Pay Components', hint: 'Define building blocks', countKey: 'payComponents' },
  { key: 'structures', index: 2, label: 'Salary Structures', hint: 'Compose templates', countKey: 'salaryStructures' },
  { key: 'assignment', index: 3, label: 'Assign CTC', hint: 'Employee compensation' },
  { key: 'revision', index: 4, label: 'Revisions', hint: 'Increments & bulk' },
  { key: 'approvals', index: 5, label: 'Approvals', hint: 'Review & sign off', countKey: 'pendingApprovals' },
  { key: 'history', index: 6, label: 'History', hint: 'Audit timeline' },
];

interface WorkflowRailProps {
  /** Extra callback when a step is chosen (e.g. close the mobile drawer). */
  onNavigate?: (key: CompensationTabKey) => void;
  /** Desktop collapse: when true the rail shows icons only. */
  collapsed?: boolean;
  /** Toggle handler for the collapse control (omitted in the mobile drawer). */
  onToggleCollapse?: () => void;
}

const WorkflowRail: React.FC<WorkflowRailProps> = ({ onNavigate, collapsed = false, onToggleCollapse }) => {
  const activeTab = useHrmCompensationStore((s) => s.activeTab);
  const setActiveTab = useHrmCompensationStore((s) => s.setActiveTab);
  const componentsCount = useHrmCompensationStore((s) => s.payComponents.length);
  const structuresCount = useHrmCompensationStore((s) => s.salaryStructures.length);
  const pendingCount = useHrmCompensationStore((s) => s.pendingApprovals.length);

  const countFor = (step: WorkflowStep): number | null => {
    switch (step.countKey) {
      case 'payComponents':
        return componentsCount;
      case 'salaryStructures':
        return structuresCount;
      case 'pendingApprovals':
        return pendingCount;
      default:
        return null;
    }
  };

  const handleClick = (key: CompensationTabKey) => {
    setActiveTab(key);
    onNavigate?.(key);
  };

  return (
    <nav
      className={`${styles.rail} ${collapsed ? styles.railCollapsed : ''}`}
      aria-label="Compensation workflow"
    >
      <div className={styles.railBrand}>
        <span className={styles.railBrandMark}>₹</span>
        <div className={styles.railBrandText}>
          <span className={styles.railBrandTitle}>Compensation Studio</span>
          <span className={styles.railBrandSub}>Guided workflow</span>
        </div>
        {onToggleCollapse && (
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <button
              type="button"
              className={styles.railCollapseBtn}
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand workflow rail' : 'Collapse workflow rail'}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronRightIcon style={{ fontSize: 18 }} />
              ) : (
                <ChevronLeftIcon style={{ fontSize: 18 }} />
              )}
            </button>
          </Tooltip>
        )}
      </div>

      <ul className={styles.railList}>
        {WORKFLOW_STEPS.map((step) => {
          const isActive = activeTab === step.key;
          const count = countFor(step);
          const isOverview = step.key === 'overview';
          return (
            <li key={step.key}>
              <Tooltip title={collapsed ? step.label : ''} placement="right">
                <button
                  type="button"
                  className={`${styles.railItem} ${isActive ? styles.railItemActive : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                  data-step={step.key}
                  onClick={() => handleClick(step.key)}
                >
                  <span className={styles.railChip} aria-hidden>
                    {isOverview ? '◇' : step.index}
                  </span>
                  <span className={styles.railItemBody}>
                    <span className={styles.railItemLabel}>{step.label}</span>
                    <span className={styles.railItemHint}>{step.hint}</span>
                  </span>
                  {count !== null && (
                    <Tooltip title={`${count} ${step.label.toLowerCase()}`}>
                      <Badge
                        count={count}
                        overflowCount={999}
                        showZero
                        className={
                          step.key === 'approvals' && count > 0
                            ? styles.railBadgeAlert
                            : styles.railBadge
                        }
                      />
                    </Tooltip>
                  )}
                </button>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default WorkflowRail;
