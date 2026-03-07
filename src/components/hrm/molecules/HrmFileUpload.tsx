'use client';

import React, { useCallback } from 'react';
import { Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import styles from '../styles/HrmShared.module.css';

const { Dragger } = Upload;

interface HrmFileUploadProps {
  accept: string;
  maxSize: number;
  onUpload: (files: File[]) => void;
  multiple?: boolean;
}

/**
 * HrmFileUpload
 *
 * Drag-and-drop file upload area built on Ant Design Upload.Dragger.
 * Validates file type (via accept string) and file size before passing
 * accepted files to the onUpload callback. Does not auto-upload; files
 * are handled client-side.
 *
 * @param accept   - Comma-separated MIME types or extensions (e.g. ".pdf,.docx")
 * @param maxSize  - Maximum file size in megabytes
 * @param onUpload - Called with the array of valid File objects
 * @param multiple - Whether multiple file selection is allowed
 */
const HrmFileUpload: React.FC<HrmFileUploadProps> = ({
  accept,
  maxSize,
  onUpload,
  multiple = false,
}) => {
  const formatMaxSize = (sizeMb: number): string => {
    if (sizeMb >= 1) return `${sizeMb} MB`;
    return `${Math.round(sizeMb * 1024)} KB`;
  };

  const beforeUpload = useCallback(
    (file: UploadFile): boolean => {
      const rawFile = file as unknown as File;

      // Validate file size
      const sizeInMb = rawFile.size / (1024 * 1024);
      if (sizeInMb > maxSize) {
        message.error(
          `${rawFile.name} exceeds the maximum size of ${formatMaxSize(maxSize)}.`,
        );
        return false;
      }

      return true;
    },
    [maxSize],
  );

  const handleChange: UploadProps['onChange'] = useCallback(
    (info) => {
      // Collect all files that passed beforeUpload
      const validFiles = info.fileList
        .filter((f) => f.status !== 'error')
        .map((f) => f.originFileObj)
        .filter(Boolean) as File[];

      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    },
    [onUpload],
  );

  return (
    <div>
      <Dragger
        accept={accept}
        multiple={multiple}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        customRequest={({ onSuccess }) => {
          // Prevent auto HTTP upload; treat as client-side only
          setTimeout(() => onSuccess?.('ok'), 0);
        }}
        showUploadList
      >
        <p style={{ fontSize: 32, color: '#8c8c8c', margin: '8px 0' }}>
          <CloudUploadOutlined fontSize="inherit" />
        </p>
        <p style={{ fontSize: 14, color: '#262626' }}>
          Click or drag files to upload
        </p>
        <p className={styles.fileUploadHint}>
          Accepted: {accept} | Max size: {formatMaxSize(maxSize)}
        </p>
      </Dragger>
    </div>
  );
};

export default HrmFileUpload;
