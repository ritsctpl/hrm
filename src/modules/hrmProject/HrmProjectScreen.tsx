'use client';
import React from 'react';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useHrmProjectStore } from './stores/hrmProjectStore';
import ProjectForm from './components/organisms/ProjectForm';

const { Title } = Typography;

export default function HrmProjectScreen() {
  const { editingProject, closeProjectForm } = useHrmProjectStore();

  return (
    <div style={{ padding: 16, background: '#f0f2f5', flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={closeProjectForm} size="small">Back</Button>
        <Title level={5} style={{ margin: 0 }}>
          {editingProject ? `Edit — ${editingProject.projectCode}` : 'New Project'}
        </Title>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
        <ProjectForm />
      </div>
    </div>
  );
}
