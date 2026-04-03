'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { QUICK_TASKS } from '@/config/dashboardConfig';
import { getModuleIcon } from '@utils/moduleIconMap';
import styles from './RightPanel.module.css';

const QuickTasksList: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div>
      {QUICK_TASKS.map((task) => {
        const Icon = getModuleIcon(task.route);
        return (
          <div
            key={task.labelKey}
            className={styles.taskItem}
            onClick={() => router.push(task.route)}
          >
            <Icon size={16} />
            <span>{t(task.labelKey)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default QuickTasksList;
