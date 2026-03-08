'use client';

import React, { useState } from 'react';
import { Button, Upload, Table, message, Card, Space, Select, Divider, Alert, Tag } from 'antd';
import { UploadOutlined, DownloadOutlined, FileSearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { HrmAccessService } from '../../services/hrmAccessService';
import type { ImportRowError } from '../../types/api.types';

interface Props {
  site: string;
  user: { id: string; name: string } | null;
}

const ImportExportTemplate: React.FC<Props> = ({ site, user }) => {
  const [importType, setImportType] = useState<'roles' | 'userAssignments'>('roles');
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRowError[] | null>(null);
  const [previewStats, setPreviewStats] = useState<{ total: number; valid: number; invalid: number } | null>(null);

  const handlePreview = async () => {
    if (!selectedFile) {
      message.warning('Please select a file first');
      return;
    }
    setPreviewing(true);
    try {
      const result = await HrmAccessService.previewImport(site, selectedFile);
      setPreviewData(result.errors ?? []);
      setPreviewStats({
        total: result.totalRows,
        valid: result.validRows,
        invalid: result.invalidRows,
      });
    } catch {
      message.error('Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    try {
      const result = importType === 'roles'
        ? await HrmAccessService.importRoles(site, selectedFile, user?.id ?? '')
        : await HrmAccessService.importUserAssignments(site, selectedFile, user?.id ?? '');
      message.success(
        `Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`
      );
      setPreviewData(null);
      setPreviewStats(null);
      setSelectedFile(null);
    } catch {
      message.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExportRoles = async (format: 'csv' | 'json') => {
    try {
      const blob = await HrmAccessService.exportRoles(site, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roles.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Export complete');
    } catch {
      message.error('Export failed');
    }
  };

  const handleExportPermissions = async (format: 'csv' | 'json') => {
    try {
      const blob = await HrmAccessService.exportRolePermissions(site, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `role-permissions.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Export complete');
    } catch {
      message.error('Export failed');
    }
  };

  const previewColumns: ColumnsType<ImportRowError> = [
    { title: 'Row', dataIndex: 'rowNumber', width: 60 },
    {
      title: 'Status',
      dataIndex: 'isValid',
      width: 80,
      render: (v: boolean) => v ? <Tag color="success">OK</Tag> : <Tag color="error">Error</Tag>,
    },
    {
      title: 'Data',
      dataIndex: 'data',
      render: (data: Record<string, string>) => (
        <span style={{ fontSize: 12 }}>{JSON.stringify(data)}</span>
      ),
    },
    {
      title: 'Errors',
      dataIndex: 'validationErrors',
      render: (errors: string[]) =>
        errors?.length > 0 ? (
          <span style={{ color: '#ff4d4f', fontSize: 12 }}>{errors.join('; ')}</span>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Import Section */}
      <Card title="Import" size="small">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <Select
            value={importType}
            onChange={(v) => {
              setImportType(v);
              setPreviewData(null);
              setPreviewStats(null);
              setSelectedFile(null);
            }}
            style={{ width: 200 }}
            options={[
              { label: 'Roles', value: 'roles' },
              { label: 'User Assignments', value: 'userAssignments' },
            ]}
          />
          <Upload
            accept=".csv,.json"
            showUploadList={false}
            beforeUpload={(file) => {
              setSelectedFile(file);
              setPreviewData(null);
              setPreviewStats(null);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>
              {selectedFile ? selectedFile.name : 'Select File'}
            </Button>
          </Upload>
          <Button
            icon={<FileSearchOutlined />}
            onClick={handlePreview}
            loading={previewing}
            disabled={!selectedFile}
          >
            Preview
          </Button>
          <Button
            type="primary"
            onClick={handleCommitImport}
            loading={importing}
            disabled={!selectedFile || (previewData !== null && previewStats?.invalid !== 0)}
          >
            Commit Import
          </Button>
        </div>

        {previewStats && (
          <Alert
            type={previewStats.invalid === 0 ? 'success' : 'warning'}
            showIcon
            message={`Total: ${previewStats.total} | Valid: ${previewStats.valid} | Invalid: ${previewStats.invalid}`}
            style={{ marginBottom: 12 }}
          />
        )}

        {previewData && previewData.length > 0 && (
          <Table
            dataSource={previewData}
            columns={previewColumns}
            rowKey="rowNumber"
            size="small"
            pagination={{ pageSize: 10, showTotal: (t) => `${t} rows` }}
          />
        )}
      </Card>

      {/* Export Section */}
      <Card title="Export" size="small">
        <Space direction="vertical" size="middle">
          <div>
            <strong>Roles</strong>
            <div style={{ marginTop: 8 }}>
              <Button icon={<DownloadOutlined />} onClick={() => handleExportRoles('csv')} style={{ marginRight: 8 }}>
                CSV
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => handleExportRoles('json')}>JSON</Button>
            </div>
          </div>
          <Divider style={{ margin: '4px 0' }} />
          <div>
            <strong>Role Permissions</strong>
            <div style={{ marginTop: 8 }}>
              <Button icon={<DownloadOutlined />} onClick={() => handleExportPermissions('csv')} style={{ marginRight: 8 }}>
                CSV
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => handleExportPermissions('json')}>JSON</Button>
            </div>
          </div>
          <Divider style={{ margin: '4px 0' }} />
          <div>
            <strong>User Assignments</strong>
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
              User assignment export uses the same format as the roles export endpoint.
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ImportExportTemplate;
