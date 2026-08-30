'use client';

import React, { useEffect, useState } from 'react';
import { Button, Drawer, Grid } from 'antd';
import MenuIcon from '@mui/icons-material/Menu';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { CompensationTabKey } from '../../types/ui.types';
import PayComponentsTable from '../organisms/PayComponentsTable';
import StructuresView from '../organisms/StructuresView';
import EmployeeCompensationForm from '../organisms/EmployeeCompensationForm';
import SalaryRevisionTable from '../organisms/SalaryRevisionTable';
import ApprovalInbox from '../organisms/ApprovalInbox';
import CompensationOverview from '../organisms/CompensationOverview';
import CompensationHistory from '../organisms/CompensationHistory';
import WorkflowRail, { WORKFLOW_STEPS } from './WorkflowRail';
import styles from '../../styles/Compensation.module.css';

const { useBreakpoint } = Grid;

const renderStepBody = (key: CompensationTabKey): React.ReactNode => {
  switch (key) {
    case 'overview':
      return <CompensationOverview />;
    case 'components':
      return <PayComponentsTable />;
    case 'structures':
      return <StructuresView />;
    case 'assignment':
      return <EmployeeCompensationForm />;
    case 'revision':
      return <SalaryRevisionTable />;
    case 'approvals':
      return <ApprovalInbox />;
    case 'history':
      return <CompensationHistory />;
    default:
      return null;
  }
};

const RAIL_COLLAPSE_KEY = 'hrmComp.railCollapsed';

const CompensationTabLayout: React.FC = () => {
  const activeTab = useHrmCompensationStore((s) => s.activeTab);
  const screens = useBreakpoint();
  const isNarrow = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);

  // Restore the collapse preference once mounted (guarded — storage can throw/empty).
  useEffect(() => {
    try {
      if (localStorage.getItem(RAIL_COLLAPSE_KEY) === '1') setRailCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleRail = () => {
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(RAIL_COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const activeStep = WORKFLOW_STEPS.find((s) => s.key === activeTab);

  return (
    <div className={styles.workflowShell}>
      {!isNarrow && (
        <aside className={`${styles.railColumn} ${railCollapsed ? styles.railColumnCollapsed : ''}`}>
          <WorkflowRail collapsed={railCollapsed} onToggleCollapse={toggleRail} />
        </aside>
      )}

      {isNarrow && (
        <Drawer
          placement="left"
          width={272}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
          className={styles.railDrawer}
        >
          <WorkflowRail onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      <section className={styles.workflowContent}>
        {isNarrow && (
          <div className={styles.contentTopbar}>
            <Button
              type="text"
              icon={<MenuIcon />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open workflow menu"
            />
            <span className={styles.contentTopbarTitle}>{activeStep?.label ?? 'Compensation'}</span>
          </div>
        )}
        <div className={styles.workflowBody} key={activeTab}>
          {renderStepBody(activeTab)}
        </div>
      </section>
    </div>
  );
};

export default CompensationTabLayout;
