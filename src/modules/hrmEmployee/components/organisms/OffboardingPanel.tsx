'use client';

import React, { useState } from 'react';
import { Drawer, Form, Input, DatePicker, Button, message, Alert, Empty, Table, Divider, Modal, Typography } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import Can from '../../../hrmAccess/components/Can';
import { HrmLeaveService } from '../../../hrmLeave/services/hrmLeaveService';
import type { SettleSeparationResponse, LeaveSettlementItem } from '../../../hrmLeave/types/api.types';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  employeeHandle?: string;
  employeeName?: string;
}

const OffboardingPanel: React.FC<Props> = ({ open, onClose, employeeHandle, employeeName }) => {
  const [form] = Form.useForm();
  const [initiating, setInitiating] = useState(false);

  // ── Leave Settlement state ──────────────────────────────────────────
  const [settlement, setSettlement] = useState<SettleSeparationResponse | null>(null);
  const [settlingLeave, setSettlingLeave] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);

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

  // ── Leave Settlement handler ────────────────────────────────────────
  const handleSettleLeave = () => {
    const exitDate = form.getFieldValue('exitDate');
    if (!exitDate) {
      message.warning('Please enter the Exit Date before processing leave settlement');
      return;
    }
    if (!employeeHandle) {
      message.warning('No employee selected');
      return;
    }

    Modal.confirm({
      title: 'Confirm Leave Settlement',
      content:
        'This will encash eligible balances, lapse remaining, and cancel pending requests. Continue?',
      okText: 'Yes, Process',
      cancelText: 'Cancel',
      onOk: async () => {
        setSettlingLeave(true);
        try {
          const cookies = parseCookies();
          const result = await HrmLeaveService.settleLeaveOnSeparation({
            organizationId: getOrganizationId(),
            employeeId: employeeHandle,
            lastWorkingDate: exitDate,
            triggeredBy: cookies.username || 'system',
          });
          setSettlement(result);
          setShowSettlement(true);
          message.success('Leave settlement processed successfully');
        } catch {
          message.error('Failed to process leave settlement');
        } finally {
          setSettlingLeave(false);
        }
      },
    });
  };

  // ── Settlement table columns ────────────────────────────────────────
  const settlementColumns = [
    {
      title: 'Leave Type',
      dataIndex: 'leaveTypeName',
      key: 'leaveTypeName',
      render: (text: string, record: LeaveSettlementItem) =>
        `${text} (${record.leaveTypeCode})`,
    },
    {
      title: 'Balance',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      align: 'right' as const,
      render: (v: number) => v.toFixed(1),
    },
    {
      title: 'Encashed',
      dataIndex: 'encashedDays',
      key: 'encashedDays',
      align: 'right' as const,
      render: (v: number) => v.toFixed(1),
    },
    {
      title: 'Lapsed',
      dataIndex: 'lapsedDays',
      key: 'lapsedDays',
      align: 'right' as const,
      render: (v: number) => v.toFixed(1),
    },
    {
      title: 'Cancelled Requests',
      dataIndex: 'cancelledRequests',
      key: 'cancelledRequests',
      align: 'right' as const,
    },
  ];

  return (
    <Drawer
      title="Offboarding"
      open={open}
      onClose={onClose}
      width={600}
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

          {/* ── Leave Settlement Section ────────────────────────────── */}
          <Divider orientation="left">Leave Settlement</Divider>

          {!showSettlement && (
            <Button
              type="default"
              onClick={handleSettleLeave}
              loading={settlingLeave}
              disabled={!!settlement}
            >
              {settlement ? 'Settlement Processed' : 'Process Leave Settlement'}
            </Button>
          )}

          {showSettlement && settlement && (
            <>
              <Table<LeaveSettlementItem>
                dataSource={settlement.settlements}
                columns={settlementColumns}
                rowKey="leaveTypeCode"
                pagination={false}
                size="small"
                bordered
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>
                          {settlement.settlements
                            .reduce((sum, s) => sum + s.currentBalance, 0)
                            .toFixed(1)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong>{settlement.totalEncashed.toFixed(1)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong>{settlement.totalLapsed.toFixed(1)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <Text strong>{settlement.totalCancelledRequests}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
                style={{ marginTop: 12 }}
              />
              <Alert
                type="success"
                showIcon
                message="Leave settlement has been processed successfully."
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </>
      )}
    </Drawer>
  );
};

export default OffboardingPanel;
