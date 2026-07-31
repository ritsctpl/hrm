'use client';

import React from 'react';
import { Empty, Spin } from 'antd';
import type { ModuleGuideCount } from '../../types/domain.types';
import { moduleLabel } from '../../utils/guideConstants';
import styles from '../../styles/UserGuide.module.css';

interface ModuleRailProps {
  modules: ModuleGuideCount[];
  loading: boolean;
  activeModuleCode: string;
  onSelect: (moduleCode: string) => void;
}

/**
 * Left rail listing only the modules that actually have guides, so the user
 * never clicks into an empty section. "All modules" is the default entry.
 */
const ModuleRail: React.FC<ModuleRailProps> = ({
  modules,
  loading,
  activeModuleCode,
  onSelect,
}) => {
  const total = modules.reduce((sum, m) => sum + (m.guideCount ?? 0), 0);

  return (
    <div className={styles.rail}>
      <div className={styles.railHeader}>Modules</div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="small" />
        </div>
      ) : (
        <div className={styles.railList}>
          <button
            type="button"
            className={`${styles.railItem} ${activeModuleCode === '' ? styles.railItemActive : ''}`}
            onClick={() => onSelect('')}
          >
            <span className={styles.railItemLabel}>All modules</span>
            <span className={styles.railItemCount}>{total}</span>
          </button>

          {modules.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No guides yet"
              style={{ marginTop: 24 }}
            />
          ) : (
            modules.map((m) => (
              <button
                key={m.moduleCode}
                type="button"
                className={`${styles.railItem} ${
                  activeModuleCode === m.moduleCode ? styles.railItemActive : ''
                }`}
                onClick={() => onSelect(m.moduleCode)}
              >
                <span className={styles.railItemLabel}>
                  {m.moduleName || moduleLabel(m.moduleCode)}
                </span>
                <span className={styles.railItemCount}>{m.guideCount}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleRail;
