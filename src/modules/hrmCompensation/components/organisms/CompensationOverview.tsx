'use client';

import React, { useMemo } from 'react';
import { Empty, Tooltip, Typography } from 'antd';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { CompensationTabKey } from '../../types/ui.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import CompensationStatusTag from '../atoms/CompensationStatusTag';
import styles from '../../styles/Compensation.module.css';

interface PipelineNode {
  key: CompensationTabKey;
  label: string;
  icon: React.ReactNode;
}

const PIPELINE: PipelineNode[] = [
  { key: 'components', label: 'Components', icon: <PaymentsIcon style={{ fontSize: 20 }} /> },
  { key: 'structures', label: 'Structures', icon: <AccountTreeIcon style={{ fontSize: 20 }} /> },
  { key: 'assignment', label: 'Assign CTC', icon: <PersonAddIcon style={{ fontSize: 20 }} /> },
  { key: 'revision', label: 'Revisions', icon: <TrendingUpIcon style={{ fontSize: 20 }} /> },
  { key: 'approvals', label: 'Approve', icon: <FactCheckIcon style={{ fontSize: 20 }} /> },
];

const CompensationOverview: React.FC = () => {
  const setActiveTab = useHrmCompensationStore((s) => s.setActiveTab);
  const payComponents = useHrmCompensationStore((s) => s.payComponents);
  const salaryStructures = useHrmCompensationStore((s) => s.salaryStructures);
  const pendingApprovals = useHrmCompensationStore((s) => s.pendingApprovals);
  const compensationHistory = useHrmCompensationStore((s) => s.compensationHistory);

  const stats = useMemo(
    () => [
      {
        key: 'components' as CompensationTabKey,
        label: 'Pay Components',
        value: payComponents.length,
        icon: <PaymentsIcon style={{ fontSize: 22 }} />,
        tone: styles.statAccent,
      },
      {
        key: 'structures' as CompensationTabKey,
        label: 'Salary Structures',
        value: salaryStructures.length,
        icon: <AccountTreeIcon style={{ fontSize: 22 }} />,
        tone: styles.statInfo,
      },
      {
        key: 'assignment' as CompensationTabKey,
        label: 'Assignments',
        value: compensationHistory.length || null,
        icon: <PersonAddIcon style={{ fontSize: 22 }} />,
        tone: styles.statSuccess,
      },
      {
        key: 'approvals' as CompensationTabKey,
        label: 'Pending Approvals',
        value: pendingApprovals.length,
        icon: <FactCheckIcon style={{ fontSize: 22 }} />,
        tone: styles.statWarning,
      },
    ],
    [payComponents.length, salaryStructures.length, pendingApprovals.length, compensationHistory.length],
  );

  const recentActivity = useMemo(() => {
    const entries = compensationHistory
      .flatMap((c) =>
        (c.auditTrail ?? []).map((a) => ({
          ...a,
          employeeName: c.employeeName,
          employeeId: c.employeeId,
        })),
      )
      .sort((a, b) => (b.performedAt ?? '').localeCompare(a.performedAt ?? ''))
      .slice(0, 8);
    return entries;
  }, [compensationHistory]);

  return (
    <div className={styles.overview}>
      <header className={styles.overviewHeader}>
        <div>
          <Typography.Title level={4} className={styles.overviewTitle}>
            Compensation overview
          </Typography.Title>
          <Typography.Text className={styles.overviewSubtitle}>
            Define components, compose structures, assign CTC, revise and approve — end to end.
          </Typography.Text>
        </div>
      </header>

      {/* Pipeline diagram */}
      <section className={styles.pipeline} aria-label="Compensation pipeline">
        {PIPELINE.map((node, i) => (
          <React.Fragment key={node.key}>
            <button
              type="button"
              className={styles.pipelineNode}
              onClick={() => setActiveTab(node.key)}
            >
              <span className={styles.pipelineIcon}>{node.icon}</span>
              <span className={styles.pipelineLabel}>{node.label}</span>
            </button>
            {i < PIPELINE.length - 1 && (
              <span className={styles.pipelineArrow} aria-hidden>
                <ArrowForwardIosIcon style={{ fontSize: 12 }} />
              </span>
            )}
          </React.Fragment>
        ))}
      </section>

      {/* Stat cards */}
      <section className={styles.statGrid} aria-label="Key figures">
        {stats.map((s) => (
          <button
            type="button"
            key={s.key}
            className={`${styles.statCard} ${s.tone}`}
            onClick={() => setActiveTab(s.key)}
          >
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue}>{s.value ?? '—'}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </button>
        ))}
      </section>

      <div className={styles.overviewColumns}>
        {/* Needs attention */}
        <section className={styles.overviewPanel}>
          <div className={styles.overviewPanelHeader}>
            <span className={styles.overviewPanelTitle}>Needs attention</span>
            {pendingApprovals.length > 0 && (
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setActiveTab('approvals')}
              >
                View all
              </button>
            )}
          </div>
          {pendingApprovals.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No pending approvals"
              style={{ margin: '24px 0' }}
            />
          ) : (
            <ul className={styles.attentionList}>
              {pendingApprovals.slice(0, 6).map((item) => (
                <li key={item.handle}>
                  <button
                    type="button"
                    className={styles.attentionRow}
                    onClick={() => setActiveTab('approvals')}
                  >
                    <span className={styles.attentionMain}>
                      <span className={styles.attentionName}>{item.employeeName}</span>
                      <span className={styles.attentionMeta}>
                        {item.employeeId} · {item.department || '—'}
                      </span>
                    </span>
                    <span className={styles.attentionCtc}>{formatINRPlain(item.annualCTC)}</span>
                    <CompensationStatusTag status={item.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent activity */}
        <section className={styles.overviewPanel}>
          <div className={styles.overviewPanelHeader}>
            <span className={styles.overviewPanelTitle}>
              <HistoryIcon style={{ fontSize: 16, verticalAlign: '-3px', marginRight: 6 }} />
              Recent activity
            </span>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => setActiveTab('history')}
            >
              Open history
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Select an employee in History to see their audit trail"
              style={{ margin: '24px 0' }}
            />
          ) : (
            <ul className={styles.activityList}>
              {recentActivity.map((a, idx) => (
                <li key={`${a.employeeId}-${idx}`} className={styles.activityRow}>
                  <span className={styles.activityDot} aria-hidden />
                  <span className={styles.activityBody}>
                    <span className={styles.activityText}>
                      <strong>{a.action}</strong> · {a.employeeName}
                    </span>
                    <Tooltip title={a.remarks}>
                      <span className={styles.activityMeta}>
                        {a.performedBy} · {a.performedAt}
                      </span>
                    </Tooltip>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default CompensationOverview;
