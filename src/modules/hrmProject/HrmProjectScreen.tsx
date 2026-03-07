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
    <div style={{ padding: 24, background: '#f4f7fa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={closeProjectForm}>Back</Button>
        <Title level={4} style={{ margin: 0 }}>
          {editingProject ? `Edit — ${editingProject.projectCode}` : 'New Project'}
        </Title>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 760 }}>
        <ProjectForm />
      </div>
    </div>
  );
}
