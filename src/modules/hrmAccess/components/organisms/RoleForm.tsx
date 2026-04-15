'use client';

import React from 'react';
import { Form, Input, Select, Switch, Space, Button, Typography, Alert } from 'antd';
import SecurityIcon from '@mui/icons-material/Security';
import type { RoleFormProps } from '../../types/ui.types';
import { ROLE_SCOPES, ROLE_CODE_REGEX } from '../../utils/rbacConstants';
import styles from '../../styles/RoleManagement.module.css';

const { TextArea } = Input;
const { Text } = Typography;

const RoleForm: React.FC<RoleFormProps> = ({
  draft,
  isCreating,
  isSaving,
  isDeleting,
  errors,
  onChange,
  onSave,
  onDelete,
  onToggleStatus,
}) => {
  const isSystemRole = draft?.isSystemRole === true;
  const isExistingRole = !isCreating && !!draft?.handle;

  return (
    <div className={styles.roleForm}>
      <Text strong className={styles.formTitle}>
        {isCreating ? 'New Role' : 'Role Details'}
      </Text>

      {isSystemRole && (
        <Alert
          icon={<SecurityIcon fontSize="small" />}
          message="System Role — Cannot Delete"
          type="warning"
          showIcon
          className={styles.systemRoleAlert}
        />
      )}

      <Form layout="vertical" className={styles.formInner}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label="Role Code"
            validateStatus={errors.roleCode ? 'error' : ''}
            help={errors.roleCode}
            required
          >
            <Input
              value={draft?.roleCode ?? ''}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                onChange({ roleCode: val });
              }}
              placeholder="e.g. HR_ADMIN"
              disabled={isExistingRole}
              maxLength={50}
            />
            {isExistingRole && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Role code cannot be changed after creation.
              </Text>
            )}
          </Form.Item>

          <Form.Item
            label="Role Name"
            validateStatus={errors.roleName ? 'error' : ''}
            help={errors.roleName}
            required
          >
            <Input
              value={draft?.roleName ?? ''}
              onChange={(e) => onChange({ roleName: e.target.value })}
              placeholder="e.g. HR Administrator"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            label="Scope"
            validateStatus={errors.roleScope ? 'error' : ''}
            help={errors.roleScope}
            required
          >
            <Select
              value={draft?.roleScope}
              onChange={(val) => onChange({ roleScope: val })}
              options={ROLE_SCOPES.map((s) => ({ value: s.value, label: s.label }))}
              placeholder="Select scope"
              disabled={isSystemRole}
            />
          </Form.Item>

          <Form.Item label="Status">
            <Space>
              <Switch
                checked={draft?.isActive ?? false}
                onChange={onToggleStatus}
                disabled={isSystemRole}
              />
              <Text>{draft?.isActive ? 'Active' : 'Inactive'}</Text>
            </Space>
          </Form.Item>
        </div>

        <Form.Item
          label="Description"
          validateStatus={errors.description ? 'error' : ''}
          help={errors.description}
        >
          <TextArea
            value={draft?.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Max 500 characters..."
            maxLength={500}
            rows={3}
            showCount
          />
        </Form.Item>
      </Form>

      <Space className={styles.formActions}>
        <Button
          type="primary"
          onClick={onSave}
          loading={isSaving}
          disabled={isSaving}
        >
          Save Role
        </Button>
        {!isCreating && !isSystemRole && (
          <Button
            danger
            onClick={onDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Delete
          </Button>
        )}
      </Space>
    </div>
  );
};

export default RoleForm;
