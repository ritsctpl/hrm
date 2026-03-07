'use client';

import { Space, Typography } from 'antd';
import type { HolidayLegendProps } from '../../types/ui.types';
import styles from '../../styles/HolidayCalendar.module.css';

export default function HolidayLegend({ categories }: HolidayLegendProps) {
  const active = categories.filter((c) => c.active);
  return (
    <div className={styles.legend}>
      <Space wrap>
        {active.map((cat) => (
          <span key={cat.categoryCode} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ backgroundColor: cat.colorHex }}
            />
            <Typography.Text style={{ fontSize: 12 }}>{cat.displayName}</Typography.Text>
          </span>
        ))}
      </Space>
    </div>
  );
}
