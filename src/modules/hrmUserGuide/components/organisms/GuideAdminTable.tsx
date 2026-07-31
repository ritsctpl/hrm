'use client';

import React from 'react';
import { Button, Popconfirm, Select, Space, Table, Tooltip, Typography } from 'antd';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import GuideStatusTag from '../atoms/GuideStatusTag';
import AudienceBadge from '../atoms/AudienceBadge';
import Can from '../../../hrmAccess/components/Can';
import type { UserGuide } from '../../types/domain.types';
import { formatDate, formatFileSize } from '../../utils/guideHelpers';
import { GUIDE_TARGET_MODULES, STATUS_OPTIONS, moduleLabel } from '../../utils/guideConstants';

interface GuideAdminTableProps {
  guides: UserGuide[];
  loading: boolean;
  filterModuleCode: string;
  filterStatus: string;
  onFilterModuleChange: (code: string) => void;
  onFilterStatusChange: (status: string) => void;
  onReload: () => void;
  onCreate: () => void;
  onEdit: (guide: UserGuide) => void;
  onView: (guide: UserGuide) => void;
  onPublish: (guide: UserGuide) => void;
  onDelete: (guide: UserGuide) => void;
}

/**
 * Manage tab — every guide including DRAFT and ARCHIVED. There is no approval
 * workflow here by design, so Publish is a single action rather than a chain.
 */
const GuideAdminTable: React.FC<GuideAdminTableProps> = ({
  guides,
  loading,
  filterModuleCode,
  filterStatus,
  onFilterModuleChange,
  onFilterStatusChange,
  onReload,
  onCreate,
  onEdit,
  onView,
  onPublish,
  onDelete,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
      }}
    >
      <Select
        allowClear
        size="small"
        style={{ width: 200 }}
        placeholder="All modules"
        value={filterModuleCode || undefined}
        onChange={(v) => onFilterModuleChange(v ?? '')}
        showSearch
        optionFilterProp="label"
        options={GUIDE_TARGET_MODULES.map((m) => ({ value: m.code, label: m.label }))}
      />
      <Select
        allowClear
        size="small"
        style={{ width: 150 }}
        placeholder="All statuses"
        value={filterStatus || undefined}
        onChange={(v) => onFilterStatusChange(v ?? '')}
        options={STATUS_OPTIONS}
      />
      <div style={{ flex: 1 }} />
      <Tooltip title="Reload">
        <Button size="small" icon={<RefreshIcon style={{ fontSize: 16 }} />} onClick={onReload} />
      </Tooltip>
      <Can I="add" object="user_guide_doc">
        <Button
          type="primary"
          size="small"
          icon={<AddIcon style={{ fontSize: 16 }} />}
          onClick={onCreate}
        >
          Upload Guide
        </Button>
      </Can>
    </div>

    <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '0 16px' }}>
      <Table<UserGuide>
        size="small"
        rowKey="guideId"
        loading={loading}
        dataSource={guides}
        pagination={{ pageSize: 20, size: 'small', hideOnSinglePage: true }}
        columns={[
          {
            title: 'Module',
            dataIndex: 'moduleCode',
            width: 170,
            render: (_: string, r: UserGuide) => r.moduleName || moduleLabel(r.moduleCode),
            sorter: (a, b) => moduleLabel(a.moduleCode).localeCompare(moduleLabel(b.moduleCode)),
          },
          {
            title: 'Title',
            dataIndex: 'title',
            render: (title: string, r: UserGuide) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Typography.Text strong>{title}</Typography.Text>
                <AudienceBadge audience={r.audience} />
              </span>
            ),
          },
          { title: 'Version', dataIndex: 'version', width: 90, render: (v: string) => v || '—' },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 110,
            render: (s: UserGuide['status']) => <GuideStatusTag status={s} />,
          },
          {
            title: 'Size',
            dataIndex: 'fileSizeBytes',
            width: 90,
            render: (v: number) => formatFileSize(v),
          },
          {
            title: 'Updated',
            dataIndex: 'modifiedAt',
            width: 130,
            render: (_: string, r: UserGuide) => formatDate(r.modifiedAt || r.uploadedAt),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 160,
            render: (_: unknown, r: UserGuide) => (
              <Space size={0}>
                <Tooltip title="View">
                  <Button
                    type="text"
                    size="small"
                    icon={<VisibilityIcon style={{ fontSize: 16 }} />}
                    onClick={() => onView(r)}
                  />
                </Tooltip>
                <Can I="edit" object="user_guide_doc">
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditIcon style={{ fontSize: 16 }} />}
                      onClick={() => onEdit(r)}
                    />
                  </Tooltip>
                </Can>
                {r.status !== 'PUBLISHED' && (
                  <Can I="edit" object="user_guide_doc">
                    <Tooltip title="Publish">
                      <Button
                        type="text"
                        size="small"
                        icon={<PublishIcon style={{ fontSize: 16 }} />}
                        onClick={() => onPublish(r)}
                      />
                    </Tooltip>
                  </Can>
                )}
                <Can I="delete" object="user_guide_doc">
                  <Popconfirm
                    title="Archive guide"
                    description={`Archive "${r.title}"? Employees will stop seeing it.`}
                    okText="Archive"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDelete(r)}
                  >
                    <Tooltip title="Archive">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteIcon style={{ fontSize: 16 }} />}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Can>
              </Space>
            ),
          },
        ]}
      />
    </div>
  </div>
);

export default GuideAdminTable;
