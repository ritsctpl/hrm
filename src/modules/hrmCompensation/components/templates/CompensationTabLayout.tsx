'use client';

import React, { useState } from 'react';
import { Button, Drawer, Grid } from 'antd';
import MenuIcon from '@mui/icons-material/Menu';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { CompensationTabKey } from '../../types/ui.types';
import PayComponentList from '../organisms/PayComponentList';
import PayComponentForm from '../organisms/PayComponentForm';
import SalaryStructureList from '../organisms/SalaryStructureList';
import SalaryStructureBuilder from '../organisms/SalaryStructureBuilder';
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
      return (
        <div className={styles.masterDetailGrid}>
          <div className={styles.masterPanel}>
            <PayComponentList />
          </div>
          <div className={styles.detailPanel}>
            <PayComponentForm />
          </div>
        </div>
      );
    case 'structures':
      return (
        <div className={styles.masterDetailGridStructure}>
          <div className={styles.masterPanel}>
            <SalaryStructureList />
          </div>
          <div className={styles.detailPanel}>
            <SalaryStructureBuilder />
          </div>
        </div>
      );
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

const CompensationTabLayout: React.FC = () => {
  const activeTab = useHrmCompensationStore((s) => s.activeTab);
  const screens = useBreakpoint();
  const isNarrow = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeStep = WORKFLOW_STEPS.find((s) => s.key === activeTab);

  return (
    <div className={styles.workflowShell}>
      {!isNarrow && (
        <aside className={styles.railColumn}>
          <WorkflowRail />
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
