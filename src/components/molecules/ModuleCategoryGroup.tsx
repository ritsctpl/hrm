'use client';

import React from 'react';
import Tile from '../Tile';
import { getModuleIcon } from '@utils/moduleIconMap';
import type { ModuleCategoryGroupProps } from '@modules/hrmAccess/types/ui.types';
import styles from './ModuleCategoryGroup.module.css';

const ModuleCategoryGroup: React.FC<ModuleCategoryGroupProps> = ({
  category,
  modules,
}) => {
  if (!modules || modules.length === 0) return null;

  return (
    <div className={styles.categoryGroup} data-testid={`category-group-${category}`}>
      <h3 className={styles.categoryLabel}>{category}</h3>
      <div className={styles.tileGrid} data-testid="tile-grid">
        {modules.map((mod) => (
          <Tile
            key={mod.moduleCode}
            description={mod.moduleName}
            url={mod.appUrl}
            activityId={mod.moduleCode}
            icon={getModuleIcon(mod.appUrl)}
          />
        ))}
      </div>
    </div>
  );
};

export default ModuleCategoryGroup;
