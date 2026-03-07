'use client';

import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { PayslipSummary } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

interface PayslipListItemProps {
  item: PayslipSummary;
}

export default function PayslipListItem({ item }: PayslipListItemProps) {
  return (
    <div className={styles.payslipItem}>
      <div className={styles.payslipMonth}>
        {item.month} {item.year}
      </div>
      <div className={styles.payslipNet}>
        {item.currency} {item.netPay.toLocaleString()}
      </div>
      {item.downloadUrl && (
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          href={item.downloadUrl}
          target="_blank"
          className={styles.payslipDownload}
        >
          PDF
        </Button>
      )}
    </div>
  );
}
