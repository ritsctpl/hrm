'use client';

import React, { useState } from 'react';
import { Drawer, Form, Input, DatePicker, Button, message, Alert, Empty } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import Can from '../../../hrmAccess/components/Can';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeHandle?: string;
  employeeName?: string;
}

const OffboardingPanel: React.FC<Props> = ({ open, onClose, employeeHandle, employeeName }) => {
  const [form] = Form.useForm();
  const [initiating, setInitiating] = useState(false);

  const handleInitiate = async () => {
    try {
      const values = await form.validateFields();
      if (!employeeHandle) {
        message.warning('No employee selected for offboarding');
        return;
      }
      setInitiating(true);
      const cookies = parseCookies();
      await HrmEmployeeService.initiateOffboarding(
        getOrganizationId(),
        employeeHandle,
        values.exitDate,
        values.reason,
        cookies.username || 'system'
      );
      message.success('Offboarding initiated');
      form.resetFields();
      onClose();
    } catch {
      // validation or API error
    } finally {
      setInitiating(false);
    }
  };

  return (
    <Drawer
      title="Offboarding"
      open={open}
      onClose={onClose}
      width={500}
    >
      {!employeeHandle ? (
        <Empty description="Select an employee profile first, then initiate offboarding from their profile view." />
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            message={`Initiating offboarding for: ${employeeName || employeeHandle}`}
            style={{ marginBottom: 16 }}
          />
          <Form form={form} layout="vertical">
            <Form.Item name="exitDate" label="Exit Date" rules={[{ required: true, message: 'Exit date is required' }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Reason is required' }]}>
              <Input.TextArea rows={3} placeholder="e.g., Voluntary Resignation" />
            </Form.Item>
            <Can I="edit" object="employee_offboarding">
              <Button type="primary" onClick={handleInitiate} loading={initiating}>
                Initiate Offboarding
              </Button>
            </Can>
          </Form>
        </>
      )}
    </Drawer>
  );
};

export default OffboardingPanel;
