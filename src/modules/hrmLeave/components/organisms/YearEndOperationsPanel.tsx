"use client";

import React, { useState } from "react";
import { Button, Card, InputNumber, Popconfirm, Space, Typography, message } from "antd";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

interface YearEndOperationsPanelProps {
  organizationId: string;
  onProcessed?: () => void;
}

const YearEndOperationsPanel: React.FC<YearEndOperationsPanelProps> = ({ organizationId,
  onProcessed,
}) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const currentYear = new Date().getFullYear();

  const [carryYear, setCarryYear] = useState<number>(currentYear);
  const [lapseYear, setLapseYear] = useState<number>(currentYear);
  const [encashYear, setEncashYear] = useState<number>(currentYear);

  const [carryLoading, setCarryLoading] = useState(false);
  const [lapseLoading, setLapseLoading] = useState(false);
  const [encashLoading, setEncashLoading] = useState(false);

  const handleCarryForward = async () => {
    setCarryLoading(true);
    try {
      await HrmLeaveService.processCarryForward({ organizationId,
        year: carryYear,
        triggeredBy: userId,
      });
      message.success("Carry forward processed successfully");
      onProcessed?.();
    } catch {
      message.error("Failed to process carry forward");
    } finally {
      setCarryLoading(false);
    }
  };

  const handleLapse = async () => {
    setLapseLoading(true);
    try {
      await HrmLeaveService.processLapse({ organizationId,
        year: lapseYear,
        triggeredBy: userId,
      });
      message.success("Lapse processed successfully");
      onProcessed?.();
    } catch {
      message.error("Failed to process lapse");
    } finally {
      setLapseLoading(false);
    }
  };

  const handleEncashment = async () => {
    setEncashLoading(true);
    try {
      await HrmLeaveService.processEncashment({ organizationId,
        year: encashYear,
        triggeredBy: userId,
      });
      message.success("Encashment processed successfully");
      onProcessed?.();
    } catch {
      message.error("Failed to process encashment");
    } finally {
      setEncashLoading(false);
    }
  };

  return (
    <div className={styles.yearEndPanel}>
      <Title level={5}>Year-End Operations</Title>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card size="small" title="Carry Forward">
          <Text type="secondary">
            Carries eligible unused balances from the selected year into the next year, subject to
            per-policy caps.
          </Text>
          <div style={{ marginTop: 12 }}>
            <Space>
              <InputNumber
                value={carryYear}
                min={2000}
                max={2100}
                onChange={(v) => setCarryYear(Number(v) || currentYear)}
                style={{ width: 110 }}
              />
              <Can I="add" object="leave_year_end" passIf={true}>
                <Popconfirm
                  title="Run carry forward?"
                  description={`Process carry forward for ${organizationId} / ${carryYear}`}
                  onConfirm={handleCarryForward}
                  okText="Run"
                  cancelText="Cancel"
                >
                  <Button type="primary" loading={carryLoading}>
                    Run Carry Forward
                  </Button>
                </Popconfirm>
              </Can>
            </Space>
          </div>
        </Card>

        <Card size="small" title="Lapse">
          <Text type="secondary">
            Lapses residual balances per lapse rules (applied after carry forward).
          </Text>
          <div style={{ marginTop: 12 }}>
            <Space>
              <InputNumber
                value={lapseYear}
                min={2000}
                max={2100}
                onChange={(v) => setLapseYear(Number(v) || currentYear)}
                style={{ width: 110 }}
              />
              <Can I="add" object="leave_year_end" passIf={true}>
                <Popconfirm
                  title="Run lapse?"
                  description={`Process lapse for ${organizationId} / ${lapseYear}`}
                  onConfirm={handleLapse}
                  okText="Run"
                  cancelText="Cancel"
                >
                  <Button type="primary" loading={lapseLoading}>
                    Run Lapse
                  </Button>
                </Popconfirm>
              </Can>
            </Space>
          </div>
        </Card>

        <Card size="small" title="Encashment">
          <Text type="secondary">
            Encashes eligible balances per policy encashment rules.
          </Text>
          <div style={{ marginTop: 12 }}>
            <Space>
              <InputNumber
                value={encashYear}
                min={2000}
                max={2100}
                onChange={(v) => setEncashYear(Number(v) || currentYear)}
                style={{ width: 110 }}
              />
              <Can I="add" object="leave_year_end" passIf={true}>
                <Popconfirm
                  title="Run encashment?"
                  description={`Process encashment for ${organizationId} / ${encashYear}`}
                  onConfirm={handleEncashment}
                  okText="Run"
                  cancelText="Cancel"
                >
                  <Button type="primary" loading={encashLoading}>
                    Run Encashment
                  </Button>
                </Popconfirm>
              </Can>
            </Space>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default YearEndOperationsPanel;
