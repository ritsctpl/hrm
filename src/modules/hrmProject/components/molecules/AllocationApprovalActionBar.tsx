'use client';
import { useState } from 'react';
import { Button, Input, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AllocationForm.module.css';

interface Props {
  onApprove: (remarks: string) => void;
  onReject: (remarks: string) => void;
  loading?: boolean;
}

export default function AllocationApprovalActionBar({ onApprove, onReject, loading }: Props) {
  const [remarks, setRemarks] = useState('');

  return (
    <div className={styles.approvalBar}>
      <Input.TextArea
        placeholder="Remarks (optional for approve, required for reject)"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        rows={2}
        style={{ marginBottom: 8 }}
      />
      <Space>
        <Can I="edit">
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => onReject(remarks)}
            loading={loading}
            disabled={!remarks.trim()}
          >
            Reject
          </Button>
        </Can>
        <Can I="edit">
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => onApprove(remarks)}
            loading={loading}
          >
            Approve
          </Button>
        </Can>
      </Space>
    </div>
  );
}
