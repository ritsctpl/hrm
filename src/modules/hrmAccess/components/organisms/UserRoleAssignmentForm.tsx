'use client';

import React from 'react';
import { Form, Select, Button, Input, Typography } from 'antd';
import RbacAssignmentDateRange from '../molecules/RbacAssignmentDateRange';
import type { UserRoleAssignmentFormProps } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

const { TextArea } = Input;
const { Text } = Typography;

const UserRoleAssignmentForm: React.FC<UserRoleAssignmentFormProps> = ({
  roles,
  draft,
  isAssigning,
  errors,
  onChange,
  onAssign,
}) => {
  return (
    <div className={styles.assignForm}>
      <Text strong className={styles.assignFormTitle}>
        Assign New Role
      </Text>

      <Form layout="vertical">
        <Form.Item
          label="Role"
          validateStatus={errors.roleCode ? 'error' : ''}
          help={errors.roleCode}
          required
        >
          <Select
            value={draft?.roleCode ?? undefined}
            onChange={(val) => onChange({ roleCode: val })}
            placeholder="Select role..."
            options={roles
              .filter((r) => r.isActive)
              .map((r) => ({ value: r.roleCode, label: r.roleName }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="Effective Dates"
          validateStatus={errors.effectiveFrom || errors.effectiveTo ? 'error' : ''}
          help={errors.effectiveFrom || errors.effectiveTo}
        >
          <RbacAssignmentDateRange
            effectiveFrom={draft?.effectiveFrom ?? null}
            effectiveTo={draft?.effectiveTo ?? null}
            onChangeFrom={(date) => onChange({ effectiveFrom: date })}
            onChangeTo={(date) => onChange({ effectiveTo: date })}
          />
        </Form.Item>

        <Form.Item label="Notes">
          <TextArea
            value={draft?.assignmentNotes ?? ''}
            onChange={(e) => onChange({ assignmentNotes: e.target.value })}
            placeholder="Max 500 characters..."
            maxLength={500}
            rows={3}
            showCount
          />
        </Form.Item>

        <Button
          type="primary"
          onClick={onAssign}
          loading={isAssigning}
          disabled={isAssigning}
          block
        >
          Assign Role
        </Button>
      </Form>
    </div>
  );
};

export default UserRoleAssignmentForm;
