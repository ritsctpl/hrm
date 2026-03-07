/**
 * BulkImportPanel - Modal for bulk importing employees from a file
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Modal, Upload, Button, Alert, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { BulkImportPanelProps } from '../../types/ui.types';
import type { BulkImportResponse, BulkImportError } from '../../types/api.types';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

const BulkImportPanel: React.FC<BulkImportPanelProps> = ({ open, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResponse | null>(null);

  const handleImport = useCallback(async () => {
    if (!file) {
      message.warning('Please select a file');
      return;
    }

    // In a real implementation, the file would be parsed client-side or uploaded
    // For now, we demonstrate the pattern with the bulk import endpoint
    setImporting(true);
    try {
      const cookies = parseCookies();
      const site = cookies.site;
      const importedBy = cookies.username || 'system';

      // Placeholder: actual implementation would parse CSV/Excel to CreateEmployeeRequest[]
      const response = await HrmEmployeeService.bulkImport({
        site,
        employees: [],
        importedBy,
      });

      setResult(response);
      message.success(
        `Import complete: ${response.successCount} succeeded, ${response.failureCount} failed`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      message.error(msg);
    } finally {
      setImporting(false);
    }
  }, [file]);

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const errorColumns: ColumnsType<BulkImportError> = [
    { title: 'Row', dataIndex: 'rowIndex', key: 'rowIndex', width: 60 },
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    { title: 'Error', dataIndex: 'errorMessage', key: 'errorMessage' },
  ];

  return (
    <Modal
      title="Bulk Import Employees"
      open={open}
      onCancel={handleClose}
      width={600}
      destroyOnClose
      footer={
        result
          ? [
              <Button key="close" onClick={handleClose}>
                Close
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={handleClose}>
                Cancel
              </Button>,
              <Button
                key="import"
                type="primary"
                loading={importing}
                onClick={handleImport}
                disabled={!file}
              >
                Import
              </Button>,
            ]
      }
    >
      {!result ? (
        <div style={{ padding: '12px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Upload a CSV or Excel file with employee data. Download the template below for the correct format."
            style={{ marginBottom: 16 }}
          />

          <Button
            icon={<DownloadOutlined />}
            style={{ marginBottom: 16 }}
            onClick={() => message.info('Template download would be triggered here')}
          >
            Download Template
          </Button>

          <div className={formStyles.bulkImportDropZone}>
            <Upload
              beforeUpload={(f) => {
                setFile(f);
                return false;
              }}
              maxCount={1}
              onRemove={() => setFile(null)}
              accept=".csv,.xlsx,.xls"
              fileList={
                file
                  ? [{ uid: '-1', name: file.name, status: 'done' as const }]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
            <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
              Supported formats: CSV, XLSX
            </p>
          </div>
        </div>
      ) : (
        <div className={formStyles.bulkImportResults}>
          <Alert
            type={result.failureCount === 0 ? 'success' : 'warning'}
            showIcon
            message={`Processed ${result.totalProcessed} rows: ${result.successCount} succeeded, ${result.failureCount} failed`}
            style={{ marginBottom: 16 }}
          />

          {result.errors.length > 0 && (
            <Table<BulkImportError>
              columns={errorColumns}
              dataSource={result.errors}
              rowKey="rowIndex"
              size="small"
              pagination={false}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default BulkImportPanel;
