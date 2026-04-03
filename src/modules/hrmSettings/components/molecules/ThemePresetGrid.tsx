'use client';

import React from 'react';
import { Tooltip } from 'antd';
import { Check } from 'lucide-react';
import { HRM_THEME_PRESETS, COLOR_PALETTE } from '@/config/hrmThemePresets';
import styles from '../../styles/HrmSettings.module.css';
import type { ThemePresetGridProps } from '../../types/ui.types';

const ThemePresetGrid: React.FC<ThemePresetGridProps> = ({ activeThemeKey, onThemeSelect }) => {
  const allThemes = [
    ...HRM_THEME_PRESETS.map((p) => ({ key: p.key, name: p.name, color: p.accentStart, endColor: p.accentEnd })),
    ...COLOR_PALETTE.map((c) => ({ key: c.key, name: c.name, color: c.color, endColor: c.endColor })),
  ];

  return (
    <div className={styles.compactThemeGrid}>
      {allThemes.map((theme) => {
        const isActive = activeThemeKey === theme.key;
        return (
          <Tooltip key={theme.key} title={theme.name}>
            <div
              className={`${styles.themeCircle} ${isActive ? styles.themeCircleActive : ''}`}
              style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.endColor})` }}
              onClick={() => onThemeSelect(theme.key)}
            >
              {isActive && <Check size={14} color="#fff" strokeWidth={2.5} />}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default ThemePresetGrid;
