'use client';
import { Button, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';

const { Text } = Typography;

export default function WeekNavigator() {
  const { selectedWeekStart, setSelectedWeekStart } = useHrmTimesheetStore();

  const prevWeek = () => setSelectedWeekStart(dayjs(selectedWeekStart).subtract(7, 'day').format('YYYY-MM-DD'));
  const nextWeek = () => setSelectedWeekStart(dayjs(selectedWeekStart).add(7, 'day').format('YYYY-MM-DD'));

  const weekEnd = dayjs(selectedWeekStart).add(6, 'day');

  return (
    <Space>
      <Button size="small" icon={<LeftOutlined />} onClick={prevWeek} />
      <Text strong style={{ minWidth: 180, textAlign: 'center', display: 'inline-block' }}>
        {dayjs(selectedWeekStart).format('DD MMM')} — {weekEnd.format('DD MMM YYYY')}
      </Text>
      <Button size="small" icon={<RightOutlined />} onClick={nextWeek} />
    </Space>
  );
}
