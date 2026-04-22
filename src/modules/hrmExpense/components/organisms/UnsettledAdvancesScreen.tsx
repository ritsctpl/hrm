"use client";

import React, { useEffect, useState } from "react";
import { Alert, Button, Empty, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import { ReloadOutlined, LinkOutlined, WarningOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { UnsettledAdvance } from "../../types/api.types";
import ExpenseScreenHeader from "./ExpenseScreenHeader";
import styles from "../../styles/ExpenseList.module.css";

const { Text } = Typography;

interface Props {
  loadAdvances: () => Promise<UnsettledAdvance[]>;
  onSettleAdvance: (advance: UnsettledAdvance) => void;
}

const UnsettledAdvancesScreen: React.FC<Props> = ({ loadAdvances, onSettleAdvance }) => {
  const [advances, setAdvances] = useState<UnsettledAdvance[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await loadAdvances();
      setAdvances(rows);
    } catch {
      message.error("Failed to load unsettled advances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const columns: ColumnsType<UnsettledAdvance> = [
    {
      title: "Travel Reference",
      dataIndex: "travelHandle",
      width: 180,
      render: (_, r) => (
        <Tooltip title={r.travelHandle}>
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{r.travelPurpose}</span>
        </Tooltip>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 140,
      render: (_, r) => (
        <span style={{ fontSize: 13 }}>
          {r.currency} {r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Approved At",
      dataIndex: "approvedAt",
      width: 130,
      render: (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—"),
    },
    {
      title: "Outstanding",
      key: "outstanding",
      width: 130,
      render: (_, r) => {
        const overdue = r.daysOutstanding > 30;
        return (
          <Tag color={overdue ? "error" : r.daysOutstanding > 14 ? "warning" : "default"}>
            {overdue && <WarningOutlined style={{ marginRight: 4 }} />}
            {r.daysOutstanding} day{r.daysOutstanding !== 1 ? "s" : ""}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => onSettleAdvance(r)}
        >
          Settle with Claim
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.tableWrapper} style={{ display: "flex", flexDirection: "column" }}>
      <ExpenseScreenHeader
        title="Unsettled Advances"
        actions={
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            Refresh
          </Button>
        }
      />
      {advances.length > 0 && (
        <Alert
          type="warning"
          showIcon
          banner
          style={{ margin: "0 16px 8px" }}
          message={`You have ${advances.length} outstanding advance${advances.length !== 1 ? "s" : ""}. Settle them by submitting a reimbursement claim that links back to the advance.`}
        />
      )}
      <Table
        rowKey="handle"
        columns={columns}
        dataSource={advances}
        loading={loading}
        size="small"
        pagination={false}
        locale={{
          emptyText: (
            <Empty description={<Text type="secondary">No outstanding advances.</Text>} />
          ),
        }}
      />
    </div>
  );
};

export default UnsettledAdvancesScreen;
