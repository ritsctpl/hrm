'use client';

import { useEffect } from 'react';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmTimesheetStore } from './stores/hrmTimesheetStore';
import { useHrmTimesheetData } from './hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from './hooks/useHrmTimesheetUI';
import DailyTimesheetEditor from './components/organisms/DailyTimesheetEditor';
import styles from './styles/HrmTimesheet.module.css';
import dayjs from 'dayjs';

interface Props {
  date: string;
  onBack: () => void;
}

export default function HrmTimesheetScreen({ date, onBack }: Props) {
  const { currentDayTimesheet, unplannedCategories, setSelectedDate } = useHrmTimesheetStore();

  const { loadDayTimesheet } = useHrmTimesheetData();
  const { saveTimesheet, submitTimesheet, copyFromPreviousDay } = useHrmTimesheetUI();

  useEffect(() => {
    setSelectedDate(date);
    void loadDayTimesheet(date);
  }, [date, setSelectedDate, loadDayTimesheet]);

  const title = `Timesheet — ${dayjs(date).format('ddd DD MMM YYYY')}`;

  return (
    <div className={styles.timesheetLayout} style={{ height: '100vh' }}>
      <CommonAppBar
        appTitle={title}
        showBack
        onBack={onBack}
        hasChanges={false}
        isEditing={false}
        onCancel={onBack}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DailyTimesheetEditor
          onSave={saveTimesheet}
          onSubmit={submitTimesheet}
          onCopyFromPrev={copyFromPreviousDay}
        />
      </div>
    </div>
  );
}
