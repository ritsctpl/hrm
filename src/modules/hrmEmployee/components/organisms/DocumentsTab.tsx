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
import { useEmployeePermissions } from '../../hooks/useEmployeePermissions';
import { DOCUMENT_TYPE_OPTIONS } from '../../utils/constants';
import type { ProfileTabProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const DocumentsTab: React.FC<ProfileTabProps & { onRefresh: () => void }> = ({
  profile,
  onRefresh,
}) => {
  const { documents } = profile;
  const permissions = useEmployeePermissions();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('OTHER');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; fileName: string; contentType: string } | null>(null);
  const [loadingView, setLoadingView] = useState(false);

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

      // Convert file to base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await HrmEmployeeService.uploadDocument(
        site,
        profile.handle,
        docType,
        selectedFile.name,
        selectedFile.type || 'application/octet-stream',
        base64String,
        uploadedBy
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
    try {
      // Find the document in the profile
      const doc = documents.find(d => d.docId === docId);
      if (!doc) {
        message.error('Document not found');
        return;
      }

      // Check if documentBase64 is available
      if (!doc.documentBase64) {
        message.error('Document content not available');
        return;
      }

      // Determine content type from file extension or use provided contentType
      const fileName = doc.fileName || doc.documentName;
      const contentType = doc.contentType || 
        (fileName.endsWith('.pdf') ? 'application/pdf' :
         fileName.match(/\.(png|jpg|jpeg|gif)$/i) ? 'image/jpeg' :
         'application/octet-stream');

      // Convert base64 to blob
      const byteCharacters = atob(doc.documentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      
      // Create download link
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      message.success('Download started');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      message.error(msg);
    }
  }, [documents]);

  const handleView = useCallback(async (docId: string) => {
    setLoadingView(true);
    try {
      // Find the document in the profile
      const doc = documents.find(d => d.docId === docId);
      if (!doc) {
        message.error('Document not found');
        setLoadingView(false);
        return;
      }

      // Check if documentBase64 is available
      if (!doc.documentBase64) {
        message.error('Document content not available');
        setLoadingView(false);
        return;
      }

      // Determine content type from file extension or use provided contentType
      const fileName = doc.fileName || doc.documentName;
      const contentType = doc.contentType || 
        (fileName.endsWith('.pdf') ? 'application/pdf' :
         fileName.match(/\.(png|jpg|jpeg|gif)$/i) ? 'image/jpeg' :
         'application/octet-stream');

      // Convert base64 to blob
      const byteCharacters = atob(doc.documentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      setViewingDoc({
        url: blobUrl,
        fileName: fileName,
        contentType: contentType,
      });
      
      setViewerOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load document';
      message.error(msg);
    } finally {
      setLoadingView(false);
    }
  }, [documents]);

  // Cleanup blob URL when modal closes
  const handleCloseViewer = useCallback(() => {
    if (viewingDoc && viewingDoc.url && viewingDoc.url.startsWith('blob:')) {
      URL.revokeObjectURL(viewingDoc.url);
    }
    setViewerOpen(false);
    setViewingDoc(null);
  }, [viewingDoc]);

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1f2937' }}>Documents</h3>
        {permissions.canAddDocuments && (
          <Button
            type="primary"
            size="small"
            onClick={() => setUploadOpen(true)}
            style={{
              background: '#6366f1',
              borderColor: '#6366f1',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              padding: '0 12px',
            }}
          >
            Upload Document
          </Button>
        )}
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
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
            canDelete={permissions.canDeleteDocuments}
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

      <Modal
        title={viewingDoc?.fileName || 'Document Viewer'}
        open={viewerOpen}
        onCancel={handleCloseViewer}
        width={900}
        footer={[
          <Button key="close" onClick={handleCloseViewer}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={() => {
              if (viewingDoc) {
                const link = document.createElement('a');
                link.href = viewingDoc.url;
                link.download = viewingDoc.fileName;
                link.click();
              }
            }}
          >
            Download
          </Button>,
        ]}
        destroyOnHidden
      >
        {loadingView ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading document...</div>
          </div>
        ) : viewingDoc ? (
          <div style={{ width: '100%', height: '70vh', overflow: 'auto' }}>
            {viewingDoc.contentType === 'application/pdf' ? (
              <iframe
                src={viewingDoc.url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={viewingDoc.fileName}
              />
            ) : viewingDoc.contentType.startsWith('image/') ? (
              <img
                src={viewingDoc.url}
                alt={viewingDoc.fileName}
                style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Preview not available for this file type.</p>
                <Button type="primary" onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingDoc.url;
                  link.download = viewingDoc.fileName;
                  link.click();
                }}>
                  Download to View
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default DocumentsTab;
