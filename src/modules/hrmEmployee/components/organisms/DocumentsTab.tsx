/**
 * DocumentsTab - Upload, view, and delete employee documents
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button, Upload, Select, Modal, Empty, message } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import EmpDocumentRow from '../molecules/EmpDocumentRow';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import { DOCUMENT_TYPE_OPTIONS } from '../../utils/constants';
import type { ProfileTabProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const DocumentsTab: React.FC<ProfileTabProps & { onRefresh: () => void }> = ({
  profile,
  onRefresh,
}) => {
  const { documents } = profile;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('OTHER');

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      message.warning('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const cookies = parseCookies();
      const site = cookies.site;
      const uploadedBy = cookies.username || 'system';

      await HrmEmployeeService.uploadDocument(
        {
          site,
          employeeHandle: profile.handle,
          documentType: docType,
          documentName: selectedFile.name,
          uploadedBy,
        },
        selectedFile
      );
      message.success('Document uploaded');
      setUploadOpen(false);
      setSelectedFile(null);
      setDocType('OTHER');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      message.error(msg);
    } finally {
      setUploading(false);
    }
  }, [selectedFile, docType, profile.handle, onRefresh]);

  const handleDelete = useCallback(
    async (docId: string) => {
      Modal.confirm({
        title: 'Delete Document',
        content: 'Are you sure you want to delete this document?',
        okText: 'Delete',
        okType: 'danger',
        onOk: async () => {
          try {
            const cookies = parseCookies();
            const site = cookies.site;
            const deletedBy = cookies.username || 'system';

            await HrmEmployeeService.deleteDocument(site, profile.handle, docId, deletedBy);
            message.success('Document deleted');
            onRefresh();
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Delete failed';
            message.error(msg);
          }
        },
      });
    },
    [profile.handle, onRefresh]
  );

  const handleDownload = useCallback((docId: string) => {
    // In production this would call a download endpoint or use a presigned URL
    message.info(`Download requested for document ${docId}`);
  }, []);

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          type="primary"
          size="small"
          onClick={() => setUploadOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Empty description="No documents uploaded" />
      ) : (
        documents.map((doc) => (
          <EmpDocumentRow
            key={doc.docId}
            docId={doc.docId}
            docType={doc.docType}
            fileName={doc.fileName}
            uploadedAt={doc.uploadedAt}
            expiryDate={doc.expiryDate}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        ))
      )}

      <Modal
        title="Upload Document"
        open={uploadOpen}
        onOk={handleUpload}
        onCancel={() => {
          setUploadOpen(false);
          setSelectedFile(null);
        }}
        confirmLoading={uploading}
        okText="Upload"
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              Document Type
            </label>
            <Select
              value={docType}
              onChange={setDocType}
              style={{ width: '100%' }}
              options={DOCUMENT_TYPE_OPTIONS.map((dt) => ({
                value: dt.value,
                label: dt.label,
              }))}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              File
            </label>
            <Upload
              beforeUpload={(file) => {
                setSelectedFile(file);
                return false; // prevent auto upload
              }}
              maxCount={1}
              onRemove={() => setSelectedFile(null)}
              fileList={
                selectedFile
                  ? [
                      {
                        uid: '-1',
                        name: selectedFile.name,
                        status: 'done',
                      },
                    ]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsTab;
