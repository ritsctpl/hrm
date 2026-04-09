'use client';

import { Spin, Empty, Typography } from 'antd';
import CustodyHistoryRow from '../molecules/CustodyHistoryRow';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import styles from '../../styles/AssetDetail.module.css';

export default function AssetCustodyHistoryTab() {
  const { custodyHistory, loadingCustody } = useHrmAssetStore();

  if (loadingCustody) {
    return <div className={styles.spinWrapper}><Spin /></div>;
  }

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', gap: 12, padding: '6px 0', fontWeight: 600, fontSize: 12, color: '#595959', borderBottom: '1px solid #f0f0f0' }}>
        <Typography.Text strong style={{ minWidth: 80 }}>Custody ID</Typography.Text>
        <Typography.Text strong style={{ minWidth: 140 }}>Employee</Typography.Text>
        <Typography.Text strong style={{ minWidth: 100 }}>From</Typography.Text>
        <Typography.Text strong style={{ minWidth: 100 }}>To</Typography.Text>
        <Typography.Text strong>Request Ref</Typography.Text>
      </div>
      {custodyHistory.length === 0 ? (
        <Empty description="No custody history" style={{ marginTop: 32 }} />
      ) : (
        custodyHistory.map((c) => <CustodyHistoryRow key={c.custodyId} custody={c} />)
      )}
    </div>
  );
}
