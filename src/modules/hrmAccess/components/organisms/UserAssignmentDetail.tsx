import React from 'react';
import { Form, Select, DatePicker, Input, Button, Space, Alert } from 'antd';
import dayjs from 'dayjs';
import type { Role } from '../../types/domain.types';
import type { UserRoleAssignmentFormProps } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

interface UserAssignmentDetailProps extends UserRoleAssignmentFormProps {
  onCancel: () => void;
}

const UserAssignmentDetail: React.FC<UserAssignmentDetailProps> = ({
  roles,
  draft,
  isAssigning,
  errors,
  onChange,
  onAssign,
  onCancel,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (draft) {
      form.setFieldsValue({
        roleCode: draft.roleCode || undefined,
        effectiveFrom: draft.effectiveFrom ? dayjs(draft.effectiveFrom as string) : undefined,
        effectiveTo: draft.effectiveTo ? dayjs(draft.effectiveTo as string) : undefined,
        assignmentNotes: draft.assignmentNotes || undefined,
      });
    }
  }, [draft, form]);

  const handleFormChange = (changedValues: Record<string, unknown>) => {
    const updates: Record<string, unknown> = {};
    
    if ('roleCode' in changedValues) {
      updates.roleCode = changedValues.roleCode;
    }
    if ('effectiveFrom' in changedValues) {
      const dateValue = changedValues.effectiveFrom as dayjs.Dayjs | null;
      updates.effectiveFrom = dateValue ? dateValue.format('YYYY-MM-DDTHH:mm:ss') : null;
    }
    if ('effectiveTo' in changedValues) {
      const dateValue = changedValues.effectiveTo as dayjs.Dayjs | null;
      updates.effectiveTo = dateValue ? dateValue.format('YYYY-MM-DDTHH:mm:ss') : null;
    }
    if ('assignmentNotes' in changedValues) {
      updates.assignmentNotes = changedValues.assignmentNotes;
    }

    onChange(updates);
  };

  return (
    <div className={styles.assignmentDetail}>
      <h4>Assign New Role</h4>
      
      {Object.keys(errors).length > 0 && (
        <Alert
          message="Please fix the following errors:"
          description={Object.entries(errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ')}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        <Form.Item
          label="Role"
          name="roleCode"
          required
          validateStatus={errors.roleCode ? 'error' : ''}
          help={errors.roleCode}
        >
          <Select
            placeholder="Select a role"
            options={roles.map((r: Role) => ({
              label: `${r.roleCode} - ${r.roleName}`,
              value: r.roleCode,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Effective From"
          name="effectiveFrom"
          required
          validateStatus={errors.effectiveFrom ? 'error' : ''}
          help={errors.effectiveFrom}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Effective To (Optional)"
          name="effectiveTo"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Notes (Optional)"
          name="assignmentNotes"
        >
          <Input.TextArea rows={3} placeholder="Add any notes about this assignment" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              onClick={onAssign}
              loading={isAssigning}
            >
              Assign Role
            </Button>
            <Button onClick={onCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserAssignmentDetail;
