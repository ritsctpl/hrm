/**
 * AssetsTab - List of assets assigned to the employee
 */

'use client';

import React, { useCallback, useState } from 'react';
import { Table, Tag, Empty, Button, Space } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmAssetService } from '@/modules/hrmAsset/services/hrmAssetService';
import { useHrmAssetStore } from '@/modules/hrmAsset/stores/hrmAssetStore';
import { useCanDirectAssign } from '@/modules/hrmAsset/hooks/useCanDirectAssign';
import AssignAssetModal from '@/modules/hrmAsset/components/organisms/AssignAssetModal';
import { formatDate } from '../../utils/transformations';
import { ASSET_CONDITION_COLORS } from '../../utils/constants';
import type { ProfileTabProps } from '../../types/ui.types';
import type { AssetDetail } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const AssetsTab: React.FC<ProfileTabProps> = ({ profile }) => {
  const openAssignModal = useHrmAssetStore((s) => s.openAssignModal);
  const canDirectAssign = useCanDirectAssign();

  // `profile.assets` is a snapshot taken when the profile loaded. Once we
  // assign from here it is stale, so the freshly-fetched list takes over.
  const [liveAssets, setLiveAssets] = useState<AssetDetail[] | null>(null);
  const assets = liveAssets ?? profile.assets ?? profile.assetDetails ?? [];

  const refreshAssets = useCallback(async () => {
    const organizationId = getOrganizationId();
    if (!organizationId || !profile.employeeCode) return;
    try {
      const held = await HrmAssetService.getAssetsByEmployee(organizationId, profile.employeeCode);
      setLiveAssets((prev) => {
        // The asset-by-employee projection carries no allocation date, so the
        // rows we already have are the only source for it. Carry those dates
        // across rather than blanking every existing row to refresh one — a
        // newly assigned asset legitimately has no date here and shows a dash.
        const knownDates = new Map(
          [...(prev ?? []), ...(profile.assets ?? profile.assetDetails ?? [])]
            .filter((a) => a.assignedDate)
            .map((a) => [a.assetId, a.assignedDate]),
        );
        return (held || []).map((a) => ({
          assetId: a.assetId,
          assetName: a.assetName,
          category: a.categoryName ?? a.categoryCode,
          assignedDate: knownDates.get(a.assetId) ?? '',
          condition: a.status,
        }));
      });
    } catch {
      // Keep whatever is on screen; the assignment itself already succeeded
      // and reported its own outcome.
    }
  }, [profile.employeeCode, profile.assets, profile.assetDetails]);

  const columns: ColumnsType<AssetDetail> = [
    {
      title: 'Asset ID',
      dataIndex: 'assetId',
      key: 'assetId',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'assetName',
      key: 'assetName',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (c: string) => {
        const color = ASSET_CONDITION_COLORS[(c ?? '').toUpperCase()] || 'default';
        return <Tag color={color}>{c || '—'}</Tag>;
      },
    },
  ];

  // Direct assignment from the employee record: the natural path for an
  // onboarding kit, where several assets go to one person in sequence.
  const assignButton = canDirectAssign && profile.employeeCode ? (
    <Button
      type="primary"
      size="small"
      icon={<UserAddOutlined />}
      onClick={() =>
        openAssignModal({
          kind: 'employee',
          employeeId: profile.employeeCode,
          employeeName: profile.basicDetails?.fullName,
        })
      }
    >
      Assign Asset
    </Button>
  ) : null;

  return (
    <div className={styles.tabContent}>
      {assignButton && (
        <Space style={{ width: '100%', justifyContent: 'flex-end', marginBottom: 12 }}>
          {assignButton}
        </Space>
      )}

      {assets.length === 0 ? (
        <Empty description="No assets assigned" />
      ) : (
        <Table<AssetDetail>
          columns={columns}
          dataSource={assets}
          rowKey="assetId"
          size="small"
          pagination={false}
        />
      )}

      <AssignAssetModal onAssigned={refreshAssets} />
    </div>
  );
};

export default AssetsTab;
