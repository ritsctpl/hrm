'use client';

import { Space, Typography } from 'antd';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import type { GroupStatsBarProps } from '../../types/ui.types';
import styles from '../../styles/HrmHoliday.module.css';

export default function GroupStatsBar({ total, upcoming, completed, onFilterChange, activeFilter }: GroupStatsBarProps) {
  return (
    <Space className={styles.statsBar} size={16}>
      <span 
        className={`${styles.statItem} ${activeFilter === 'all' ? styles.statItemActive : ''}`}
        onClick={() => onFilterChange?.('all')}
        style={{ cursor: onFilterChange ? 'pointer' : 'default' }}
      >
        <CalendarTodayIcon style={{ fontSize: 14, color: '#1890ff' }} />
        <Typography.Text>{total} Total</Typography.Text>
      </span>
      <span 
        className={`${styles.statItem} ${activeFilter === 'upcoming' ? styles.statItemActive : ''}`}
        onClick={() => onFilterChange?.('upcoming')}
        style={{ cursor: onFilterChange ? 'pointer' : 'default' }}
      >
        <AccessTimeIcon style={{ fontSize: 14, color: '#faad14' }} />
        <Typography.Text>{upcoming} Upcoming</Typography.Text>
      </span>
      <span 
        className={`${styles.statItem} ${activeFilter === 'completed' ? styles.statItemActive : ''}`}
        onClick={() => onFilterChange?.('completed')}
        style={{ cursor: onFilterChange ? 'pointer' : 'default' }}
      >
        <CheckCircleOutline style={{ fontSize: 14, color: '#52c41a' }} />
        <Typography.Text>{completed} Done</Typography.Text>
      </span>
    </Space>
  );
}
