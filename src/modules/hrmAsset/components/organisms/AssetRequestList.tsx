'use client';

import { Spin, Empty, Button, Tabs } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import AssetRequestCard from '../molecules/AssetRequestCard';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import type { AssetRequest } from '../../types/domain.types';
import styles from '../../styles/AssetList.module.css';

interface AssetRequestListProps {
  canCreate: boolean;
  loading: boolean;
}

export default function AssetRequestList({ canCreate, loading }: AssetRequestListProps) {
  const {
    myRequests,
    selectedRequest,
    setSelectedRequest,
    openRequestForm,
  } = useHrmAssetStore();

  const handleSelect = (req: AssetRequest) => {
    setSelectedRequest(req);
  };

  if (loading) {
    return <div className={styles.spinWrapper}><Spin tip="Loading requests..." /></div>;
  }

  return (
    <div className={styles.listPanel}>
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>My Requests</span>
        {canCreate && (
          <Button
            size="small"
            type="primary"
            icon={<AddIcon style={{ fontSize: 16 }} />}
            onClick={openRequestForm}
          >
            New Request
          </Button>
        )}
      </div>

      <div className={styles.listBody}>
        {myRequests.length === 0 ? (
          <Empty description="No asset requests" style={{ marginTop: 40 }} />
        ) : (
          myRequests.map((req) => (
            <AssetRequestCard
              key={req.requestId}
              request={req}
              isSelected={selectedRequest?.requestId === req.requestId}
              onClick={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
