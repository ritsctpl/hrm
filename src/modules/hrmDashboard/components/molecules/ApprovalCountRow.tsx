'use client';

import { Badge, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { ApprovalCount } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

interface ApprovalCountRowProps {
  item: ApprovalCount;
  onNavigate?: (route: string) => void;
}

export default function ApprovalCountRow({ item, onNavigate }: ApprovalCountRowProps) {
  return (
    <div className={styles.approvalCountRow}>
      <span className={styles.approvalModule}>{item.module}</span>
      <Badge count={item.count} color="#faad14" className={styles.approvalBadge} />
      <Button
        type="link"
        size="small"
        icon={<RightOutlined />}
        onClick={() => onNavigate?.(item.route)}
        className={styles.approvalNav}
      />
    </div>
  );
}
