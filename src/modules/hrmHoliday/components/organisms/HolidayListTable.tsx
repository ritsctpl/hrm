'use client';

import { Table, Button, Space, Tooltip, Popconfirm, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HolidayCategoryTag from '../atoms/HolidayCategoryTag';
import HolidayOptionalBadge from '../atoms/HolidayOptionalBadge';
import CompWindowDisplay from '../atoms/CompWindowDisplay';
import type { HolidayListTableProps } from '../../types/ui.types';
import type { Holiday } from '../../types/domain.types';
import { formatDate, isDatePast } from '../../utils/formatters';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HolidayDetail.module.css';

export default function HolidayListTable({
  holidays,
  loading,
  groupStatus,
  onEdit,
  onDelete,
  onAddHoliday,
}: HolidayListTableProps) {
  const canEdit = !!onEdit && groupStatus !== 'LOCKED';
  const canDelete = !!onDelete && groupStatus !== 'LOCKED';

  const handleDelete = async (record: Holiday) => {
    try {
      if (onDelete) {
        await onDelete(record);
      }
    } catch (error) {
      message.error('Failed to delete holiday');
    }
  };

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
    ...(canEdit || canDelete
      ? [
          {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: Holiday) => (
              <Space size="small">
                {canEdit && (
                  <Can I="edit">
                    <Tooltip title="Edit">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditIcon style={{ fontSize: 16 }} />}
                        onClick={() => onEdit!(record)}
                      />
                    </Tooltip>
                  </Can>
                )}
                {canDelete && (
                  <Can I="delete">
                    <Popconfirm
                      title="Delete Holiday"
                      description={`Are you sure you want to delete "${record.name}"?`}
                      onConfirm={() => handleDelete(record)}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteIcon style={{ fontSize: 16 }} />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Can>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={styles.listTableWrapper}>
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
