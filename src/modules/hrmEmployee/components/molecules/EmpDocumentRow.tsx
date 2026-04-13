/**
 * EmpDocumentRow - Single document row with view, download and delete actions
 */

'use client';

import React from 'react';
import { Button, Tooltip } from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { formatDate, isExpiringSoon, isExpired } from '../../utils/transformations';
import Can from '../../../hrmAccess/components/Can';
import type { EmpDocumentRowProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const EmpDocumentRow: React.FC<EmpDocumentRowProps> = ({
  docId,
  docType,
  fileName,
  uploadedAt,
  expiryDate,
  onView,
  onDownload,
  onDelete,
}) => {
  const expired = isExpired(expiryDate);
  const expiringSoon = !expired && isExpiringSoon(expiryDate);

  return (
    <div className={styles.docRow}>
      <div className={styles.docRowLeft}>
        <FileTextOutlined className={styles.docRowIcon} />
        <div className={styles.docRowInfo}>
          <span className={styles.docRowName}>
            {fileName}
            {expired && (
              <Tooltip title="Expired">
                <WarningOutlined style={{ color: '#ef4444', marginLeft: 6, fontSize: 12 }} />
              </Tooltip>
            )}
            {expiringSoon && (
              <Tooltip title="Expiring soon">
                <WarningOutlined style={{ color: '#f59e0b', marginLeft: 6, fontSize: 12 }} />
              </Tooltip>
            )}
          </span>
          <span className={styles.docRowMeta}>
            {docType} &middot; Uploaded {formatDate(uploadedAt)}
            {expiryDate && ` &middot; Expires ${formatDate(expiryDate)}`}
          </span>
        </div>
      </div>

      <div className={styles.docRowActions}>
        {onView && (
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(docId)}
            />
          </Tooltip>
        )}
        <Tooltip title="Download">
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => onDownload(docId)}
          />
        </Tooltip>
        <Can I="delete" object="employee_document">
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(docId)}
            />
          </Tooltip>
        </Can>
      </div>
    </div>
  );
};

export default EmpDocumentRow;
