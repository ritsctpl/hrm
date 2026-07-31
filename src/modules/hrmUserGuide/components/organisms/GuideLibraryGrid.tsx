'use client';

import React from 'react';
import { Empty, Spin, Table, Tooltip, Button, Typography } from 'antd';
import DownloadIcon from '@mui/icons-material/Download';
import GuideCard from '../molecules/GuideCard';
import AudienceBadge from '../atoms/AudienceBadge';
import type { UserGuide } from '../../types/domain.types';
import type { GuideViewMode } from '../../types/ui.types';
import { formatDate, formatFileSize, groupByModule } from '../../utils/guideHelpers';
import { moduleLabel } from '../../utils/guideConstants';
import styles from '../../styles/UserGuide.module.css';

interface GuideLibraryGridProps {
  guides: UserGuide[];
  loading: boolean;
  viewMode: GuideViewMode;
  onOpen: (guide: UserGuide) => void;
  onDownload: (guide: UserGuide) => void;
  downloadingId?: string | null;
  emptyAction?: React.ReactNode;
}

/**
 * The library body. Cards are grouped under a sticky module header so a user
 * scanning "All modules" can still tell what each guide documents; list mode
 * is the same data flattened into a table for faster scanning.
 */
const GuideLibraryGrid: React.FC<GuideLibraryGridProps> = ({
  guides,
  loading,
  viewMode,
  onOpen,
  onDownload,
  downloadingId,
  emptyAction,
}) => {
  if (loading) {
    return (
      <div className={styles.centered}>
        <Spin />
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className={styles.centered}>
        <Empty description="No guides published for this module yet">{emptyAction}</Empty>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className={styles.scrollArea}>
        <Table<UserGuide>
          size="small"
          rowKey="guideId"
          dataSource={guides}
          pagination={false}
          onRow={(record) => ({ onClick: () => onOpen(record), style: { cursor: 'pointer' } })}
          columns={[
            {
              title: 'Module',
              dataIndex: 'moduleCode',
              width: 180,
              render: (_: string, r: UserGuide) => r.moduleName || moduleLabel(r.moduleCode),
              sorter: (a, b) => moduleLabel(a.moduleCode).localeCompare(moduleLabel(b.moduleCode)),
            },
            {
              title: 'Guide',
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
              title: '',
              key: 'actions',
              width: 60,
              render: (_: unknown, r: UserGuide) => (
                <Tooltip title="Download">
                  <Button
                    size="small"
                    type="text"
                    loading={downloadingId === r.guideId}
                    icon={<DownloadIcon style={{ fontSize: 16 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(r);
                    }}
                  />
                </Tooltip>
              ),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className={styles.scrollArea}>
      {groupByModule(guides).map((group) => (
        <section key={group.moduleCode} className={styles.groupSection}>
          <div className={styles.groupHeader}>
            {group.moduleName}
            <span className={styles.groupCount}>{group.guides.length}</span>
          </div>
          <div className={styles.cardGrid}>
            {group.guides.map((guide) => (
              <GuideCard
                key={guide.guideId}
                guide={guide}
                onOpen={onOpen}
                onDownload={onDownload}
                downloading={downloadingId === guide.guideId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default GuideLibraryGrid;
