'use client';

import { Table, Button, Space, Tooltip, Popconfirm, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import HolidayCategoryTag from '../atoms/HolidayCategoryTag';
import HolidayStatusIcon from '../atoms/HolidayStatusIcon';
import HolidayOptionalBadge from '../atoms/HolidayOptionalBadge';
import CompWindowDisplay from '../atoms/CompWindowDisplay';
import type { HolidayListTableProps } from '../../types/ui.types';
import type { Holiday } from '../../types/domain.types';
import { formatDate, isDatePast } from '../../utils/formatters';
import styles from '../../styles/HolidayDetail.module.css';

export default function HolidayListTable({
  holidays,
  loading,
  groupStatus,
  onEdit,
  onAddHoliday,
}: HolidayListTableProps) {
  const canEdit = !!onEdit && groupStatus !== 'LOCKED';

  const columns: ColumnsType<Holiday> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (date: string) => formatDate(date),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      width: 90,
      render: (day: string) => day?.substring(0, 3) ?? '',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Holiday) => (
        <Space size={4}>
          <span>{name}</span>
          {record.optional && <HolidayOptionalBadge />}
          {record.compensatory && (
            <CompWindowDisplay start={record.compWindowStart} end={record.compWindowEnd} />
          )}
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (_: string, record: Holiday) => {
        console.log('Category render:', {
          category: record.category,
          displayName: record.categoryDisplayName,
          colorHex: record.categoryColorHex,
        });
        return (
          <HolidayCategoryTag
            categoryCode={record.category}
            displayName={record.categoryDisplayName}
            colorHex={record.categoryColorHex}
            isFaded={isDatePast(record.date)}
          />
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'holidayStatus',
      key: 'holidayStatus',
      width: 80,
      render: (status: Holiday['holidayStatus']) => <HolidayStatusIcon status={status} />,
    },
    ...(canEdit
      ? [
          {
            title: '',
            key: 'actions',
            width: 60,
            render: (_: unknown, record: Holiday) => (
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditIcon style={{ fontSize: 16 }} />}
                  onClick={() => onEdit!(record)}
                />
              </Tooltip>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={styles.listTableWrapper}>
      {onAddHoliday && groupStatus !== 'LOCKED' && (
        <div className={styles.tableActions}>
          <Button
            type="primary"
            size="small"
            icon={<AddIcon style={{ fontSize: 16 }} />}
            onClick={onAddHoliday}
          >
            Add Holiday
          </Button>
        </div>
      )}
      <Table<Holiday>
        columns={columns}
        dataSource={holidays}
        rowKey="handle"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        locale={{ emptyText: <Empty description="No holidays found" /> }}
      />
    </div>
  );
}
