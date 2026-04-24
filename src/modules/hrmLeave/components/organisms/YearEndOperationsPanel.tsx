"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  InputNumber,
  Popconfirm,
  Space,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DollarOutlined,
  FallOutlined,
  PlayCircleOutlined,
  SwapRightOutlined,
} from "@ant-design/icons";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

interface YearEndOperationsPanelProps {
  organizationId: string;
  onProcessed?: () => void;
}

const YearEndOperationsPanel: React.FC<YearEndOperationsPanelProps> = ({
  organizationId,
  onProcessed,
}) => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for triggeredBy.
  const userId = identity.employeeIdWithName || cookies.userId || "";
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState<number>(currentYear);

  const [encashLoading, setEncashLoading] = useState(false);
  const [lapseLoading, setLapseLoading] = useState(false);
  const [carryLoading, setCarryLoading] = useState(false);
  const [sequenceLoading, setSequenceLoading] = useState(false);

  const runEncashment = async () => {
    await HrmLeaveService.processEncashment({
      organizationId,
      year,
      triggeredBy: userId,
    });
  };
  const runLapse = async () => {
    await HrmLeaveService.processLapse({
      organizationId,
      year,
      triggeredBy: userId,
    });
  };
  const runCarryForward = async () => {
    await HrmLeaveService.processCarryForward({
      organizationId,
      year,
      triggeredBy: userId,
    });
  };

  const handleEncashment = async () => {
    setEncashLoading(true);
    try {
      await runEncashment();
      message.success("Encashment processed successfully");
      onProcessed?.();
    } catch {
      message.error("Failed to process encashment");
    } finally {
      setEncashLoading(false);
    }
  };

  const handleLapse = async () => {
    setLapseLoading(true);
    try {
      await runLapse();
      message.success("Lapse processed successfully");
      onProcessed?.();
    } catch {
      message.error("Failed to process lapse");
    } finally {
      setLapseLoading(false);
    }
  };

  const handleCarryForward = async () => {
    setCarryLoading(true);
    try {
      await runCarryForward();
      message.success("Carry forward processed successfully");
      onProcessed?.();
    } catch {
      message.error("Failed to process carry forward");
    } finally {
      setCarryLoading(false);
    }
  };

  // Correct statutory order: encash eligible days first, lapse the rest,
  // then carry remaining balance forward. Halt the sequence on first
  // failure so the admin can investigate.
  const handleRunAll = async () => {
    setSequenceLoading(true);
    try {
      await runEncashment();
      message.success("1/3 · Encashment done");
      await runLapse();
      message.success("2/3 · Lapse done");
      await runCarryForward();
      message.success("3/3 · Carry forward done");
      message.success(`Year-end sequence completed for ${year}`);
      onProcessed?.();
    } catch {
      message.error("Year-end sequence halted — check individual operation");
    } finally {
      setSequenceLoading(false);
    }
  };

  const anyLoading =
    encashLoading || lapseLoading || carryLoading || sequenceLoading;

  return (
    <div className={styles.yearEndPanel}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Year-End Operations
        </Title>
        <Space>
          <Text strong>Year:</Text>
          <InputNumber
            value={year}
            min={2000}
            max={2100}
            onChange={(v) => setYear(Number(v) || currentYear)}
            style={{ width: 110 }}
          />
          <Can I="add" object="leave_year_end" passIf={true}>
            <Popconfirm
              title={`Run full sequence for ${year}?`}
              description="Encashment → Lapse → Carry Forward. This runs in sequence and halts on first error."
              onConfirm={handleRunAll}
              okText="Run All"
              cancelText="Cancel"
            >
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={sequenceLoading}
                disabled={anyLoading && !sequenceLoading}
              >
                Run Full Sequence
              </Button>
            </Popconfirm>
          </Can>
        </Space>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        <Card
          size="small"
          title={
            <Space size={6}>
              <DollarOutlined />
              <span>1 · Encashment</span>
            </Space>
          }
        >
          <Text type="secondary" style={{ fontSize: 12, display: "block", minHeight: 32 }}>
            Pays out eligible balances per policy encashment rules. Run
            before lapse to preserve value.
          </Text>
          <div style={{ marginTop: 8 }}>
            <Can I="add" object="leave_year_end" passIf={true}>
              <Popconfirm
                title={`Run encashment for ${year}?`}
                onConfirm={handleEncashment}
                okText="Run"
                cancelText="Cancel"
              >
                <Tooltip title="Process encashment only">
                  <Button
                    block
                    loading={encashLoading}
                    disabled={anyLoading && !encashLoading}
                  >
                    Run Encashment
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Can>
          </div>
        </Card>

        <Card
          size="small"
          title={
            <Space size={6}>
              <FallOutlined />
              <span>2 · Lapse</span>
            </Space>
          }
        >
          <Text type="secondary" style={{ fontSize: 12, display: "block", minHeight: 32 }}>
            Expires residual balances per lapse rules. Run after
            encashment so only un-encashable days lapse.
          </Text>
          <div style={{ marginTop: 8 }}>
            <Can I="add" object="leave_year_end" passIf={true}>
              <Popconfirm
                title={`Run lapse for ${year}?`}
                onConfirm={handleLapse}
                okText="Run"
                cancelText="Cancel"
              >
                <Tooltip title="Process lapse only">
                  <Button
                    block
                    loading={lapseLoading}
                    disabled={anyLoading && !lapseLoading}
                  >
                    Run Lapse
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Can>
          </div>
        </Card>

        <Card
          size="small"
          title={
            <Space size={6}>
              <SwapRightOutlined />
              <span>3 · Carry Forward</span>
            </Space>
          }
        >
          <Text type="secondary" style={{ fontSize: 12, display: "block", minHeight: 32 }}>
            Moves surviving balances to next year, capped by policy
            carry-forward limits.
          </Text>
          <div style={{ marginTop: 8 }}>
            <Can I="add" object="leave_year_end" passIf={true}>
              <Popconfirm
                title={`Run carry forward for ${year}?`}
                onConfirm={handleCarryForward}
                okText="Run"
                cancelText="Cancel"
              >
                <Tooltip title="Process carry forward only">
                  <Button
                    block
                    loading={carryLoading}
                    disabled={anyLoading && !carryLoading}
                  >
                    Run Carry Forward
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Can>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default YearEndOperationsPanel;
