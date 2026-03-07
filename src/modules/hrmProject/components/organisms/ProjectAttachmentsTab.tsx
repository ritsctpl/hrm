'use client';
import { Upload, Button, List, Space } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import styles from '../../styles/ProjectDetail.module.css';

export default function ProjectAttachmentsTab() {
  const { selectedProject } = useHrmProjectStore();

  if (!selectedProject) return null;

  return (
    <div className={styles.attachmentsTab}>
      <Upload>
        <Button icon={<UploadOutlined />}>Upload File</Button>
      </Upload>
      <List
        style={{ marginTop: 16 }}
        dataSource={selectedProject.attachments}
        renderItem={(att) => (
          <List.Item
            actions={[
              <Button key="dl" size="small" icon={<DownloadOutlined />}>Download</Button>,
              <Button key="del" size="small" icon={<DeleteOutlined />} danger>Delete</Button>,
            ]}
          >
            <List.Item.Meta
              title={att.fileName}
              description={`${(att.fileSizeBytes / 1024).toFixed(1)} KB | Uploaded by ${att.uploadedBy} on ${att.uploadedAt}`}
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No attachments' }}
      />
    </div>
  );
}
