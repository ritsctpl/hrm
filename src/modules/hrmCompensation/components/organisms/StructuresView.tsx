'use client';

import React, { useCallback, useState } from 'react';
import { Button, Drawer, Tooltip } from 'antd';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import type { SalaryStructure } from '../../types/domain.types';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import StructuresByGradeTable from './StructuresByGradeTable';
import StructureDetailPanel from './StructureDetailPanel';
import SalaryStructureBuilder from './SalaryStructureBuilder';
import styles from '../../styles/Compensation.module.css';

const StructuresView: React.FC = () => {
  const selectedStructure = useHrmCompensationStore((s) => s.selectedStructure);
  const selectStructure = useHrmCompensationStore((s) => s.selectStructure);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(false);

  const openNew = useCallback(() => {
    selectStructure(null);
    setDrawerOpen(true);
  }, [selectStructure]);

  const openEdit = useCallback(
    (structure: SalaryStructure) => {
      selectStructure(structure);
      setDrawerOpen(true);
    },
    [selectStructure],
  );

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className={styles.structuresView}>
      <div className={`${styles.structuresGrid} ${listCollapsed ? styles.structuresGridCollapsed : ''}`}>
        {listCollapsed ? (
          <Tooltip title="Show structures list" placement="right">
            <Button
              className={styles.structuresListToggle}
              icon={<ViewSidebarIcon style={{ fontSize: 18 }} />}
              onClick={() => setListCollapsed(false)}
            >
              Structures
            </Button>
          </Tooltip>
        ) : (
          <div className={styles.structuresListPane}>
            <div className={styles.structuresListToolbar}>
              <Tooltip title="Hide list">
                <Button
                  size="small"
                  type="text"
                  icon={<ViewSidebarIcon style={{ fontSize: 16 }} />}
                  onClick={() => setListCollapsed(true)}
                  aria-label="Collapse structures list"
                />
              </Tooltip>
            </div>
            <StructuresByGradeTable onNew={openNew} />
          </div>
        )}
        <StructureDetailPanel structure={selectedStructure} onEdit={openEdit} />
      </div>

      <Drawer
        title={null}
        placement="right"
        width={760}
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        styles={{ body: { paddingTop: 16 } }}
      >
        {drawerOpen && <SalaryStructureBuilder onSaved={closeDrawer} onCancel={closeDrawer} />}
      </Drawer>
    </div>
  );
};

export default StructuresView;
