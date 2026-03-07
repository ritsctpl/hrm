'use client';
import { Alert, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import CapacityColorDot from '../atoms/CapacityColorDot';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import type { DailyCapacity, CapacityStatus } from '../../types/domain.types';

export default function CapacityCheckPanel() {
  const { capacityCheck, loadingCapacity } = useHrmProjectStore();

  if (loadingCapacity) return <Spin />;
  if (!capacityCheck) return null;

  const hasConflicts = capacityCheck.dailyCapacities.some((d) => d.capacityStatus === 'RED');

  const columns: ColumnsType<DailyCapacity> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
    {
      title: 'Available',
      key: 'available',
      render: (_, d) => d.isHoliday ? 'HOLIDAY' : d.isLeave ? 'LEAVE' : `${d.availableHours.toFixed(1)}h`,
    },
    {
      title: 'Allocated',
      key: 'allocated',
      render: (_, d) => d.allocatedHours ? `${d.allocatedHours.toFixed(1)}h` : '—',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, d) => {
        const status: CapacityStatus = d.isHoliday || d.isLeave ? 'GREY' : d.capacityStatus;
        return <CapacityColorDot status={status} />;
      },
    },
  ];

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Capacity Check — {capacityCheck.employeeName}
      </div>
      {hasConflicts && (
        <Alert type="warning" message="Capacity conflicts detected" showIcon style={{ marginBottom: 8 }} />
      )}
      <Table
        columns={columns}
        dataSource={capacityCheck.dailyCapacities}
        rowKey="date"
        size="small"
        pagination={false}
      />
    </div>
  );
}
