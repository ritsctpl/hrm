/**
 * DocumentsTab - Upload, view, and delete employee documents
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button, Upload, Select, Modal, Empty, message } from 'antd';
import { UploadOutlined, PlusOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
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
  const [viewOpen, setViewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<typeof documents[0] | null>(null);
  const [docType, setDocType] = useState<string>('OTHER');

  // Listen for event from header button
  React.useEffect(() => {
    const handleOpenModal = () => setUploadOpen(true);
    window.addEventListener('openDocumentModal', handleOpenModal);
    return () => window.removeEventListener('openDocumentModal', handleOpenModal);
  }, []);

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

  const handleView = useCallback((doc: typeof documents[0]) => {
    setSelectedDoc(doc);
    setViewOpen(true);
  }, []);

  const handleDownload = useCallback((doc: typeof documents[0]) => {
    if (doc.documentBase64 && doc.contentType) {
      // Create blob from base64
      const byteCharacters = atob(doc.documentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.contentType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName || doc.documentName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Document downloaded');
    } else {
      message.warning('Document content not available');
    }
  }, []);

  return (
    <div className={styles.tabContent}>
      {documents.length === 0 ? (
        <Empty description="No documents uploaded" />
      ) : (
        documents.map((doc) => (
          <EmpDocumentRow
            key={doc.docId}
            docId={doc.docId}
            docType={doc.docType || doc.documentType}
            fileName={doc.fileName || doc.documentName}
            uploadedAt={doc.uploadedAt}
            expiryDate={doc.expiryDate}
            onView={() => handleView(doc)}
            onDownload={() => handleDownload(doc)}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* Upload Modal */}
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

      {/* View Document Modal */}
      <Modal
        title="View Document"
        open={viewOpen}
        onCancel={() => {
          setViewOpen(false);
          setSelectedDoc(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewOpen(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (selectedDoc) {
                handleDownload(selectedDoc);
              }
            }}
          >
            Download
          </Button>,
        ]}
        width={800}
        destroyOnHidden
      >
        {selectedDoc && selectedDoc.documentBase64 && selectedDoc.contentType ? (
          <div style={{ width: '100%', height: '600px', overflow: 'auto' }}>
            {selectedDoc.contentType.startsWith('image/') ? (
              <img
                src={`data:${selectedDoc.contentType};base64,${selectedDoc.documentBase64}`}
                alt={selectedDoc.fileName || selectedDoc.documentName}
                style={{ width: '100%', height: 'auto' }}
              />
            ) : selectedDoc.contentType === 'application/pdf' ? (
              <iframe
                src={`data:application/pdf;base64,${selectedDoc.documentBase64}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={selectedDoc.fileName || selectedDoc.documentName}
              />
            ) : (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#94a3b8', marginBottom: 16 }} />
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  Preview not available for this file type.
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  {selectedDoc.contentType}
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(selectedDoc)}
                  style={{ marginTop: 16 }}
                >
                  Download to View
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Empty description="Document content not available" />
        )}
      </Modal>
    </div>
  );
};

export default DocumentsTab;
