"use client";

import React, { useEffect, useState } from "react";
import { Steps, Tag, Typography, Spin } from "antd";
import dayjs from "dayjs";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmEmployeeService } from "../../../hrmEmployee/services/hrmEmployeeService";
import type { ApproverChainEntry } from "../../types/domain.types";

const { Text } = Typography;

interface Props {
  chain?: ApproverChainEntry[];
  currentApproverId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  ESCALATED: "volcano",
  SKIPPED: "default",
};

interface EnrichedApproverEntry extends ApproverChainEntry {
  approverFullName?: string;
  approverRole?: string;
}

const ApproverChainPanel: React.FC<Props> = ({ chain, currentApproverId }) => {
  const organizationId = getOrganizationId();
  const [enrichedChain, setEnrichedChain] = useState<EnrichedApproverEntry[]>(chain || []);
  const [loading, setLoading] = useState(false);

  // Enrich approver chain with names and roles from employee directory
  useEffect(() => {
    if (!chain || chain.length === 0) {
      setEnrichedChain([]);
      return;
    }

    const enrichChain = async () => {
      setLoading(true);
      try {
        // Fetch employee directory to get approver names and roles
        const res = await HrmEmployeeService.fetchDirectory({
          organizationId,
          page: 0,
          size: 100,
        });

        // Create a map of employee code to full details
        const empMap = new Map<string, { fullName: string; role: string }>();
        (res?.employees ?? []).forEach((emp) => {
          empMap.set(emp.employeeCode, {
            fullName: emp.fullName,
            role: emp.role,
          });
        });

        // Enrich chain entries with names and roles from directory
        const enriched = chain.map((entry) => {
          const dirEntry = empMap.get(entry.approverId);
          return {
            ...entry,
            approverFullName: dirEntry?.fullName || entry.approverName || entry.approverId,
            approverRole: dirEntry?.role || entry.approverRole,
          };
        });

        setEnrichedChain(enriched);
      } catch (error) {
        console.error('[ApproverChainPanel] Error enriching chain:', error);
        // Fallback to original chain if enrichment fails
        setEnrichedChain(chain as EnrichedApproverEntry[]);
      } finally {
        setLoading(false);
      }
    };

    enrichChain();
  }, [chain, organizationId]);

  if (loading) {
    return (
      <div style={{ padding: "12px 0", textAlign: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (!enrichedChain || enrichedChain.length === 0) {
    return (
      <div style={{ padding: "12px 0", color: "#8c8c8c", fontSize: 13 }}>
        Approver chain not available.
      </div>
    );
  }

  const sorted = [...enrichedChain].sort((a, b) => a.level - b.level);
  const currentIndex = sorted.findIndex((e) => e.approverId === currentApproverId);

  return (
    <div style={{ padding: "12px 0" }}>
      <Steps
        direction="vertical"
        size="small"
        current={currentIndex >= 0 ? currentIndex : sorted.length}
        items={sorted.map((entry) => ({
          title: (
            <span>
              <Text strong style={{ fontSize: 13 }}>
                {entry.approverFullName ?? entry.approverId}
              </Text>
              {entry.approverRole && (
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  ({entry.approverRole})
                </Text>
              )}
            </span>
          ),
          description: (
            <div style={{ fontSize: 12 }}>
              <span>{entry.approverId}</span>
              <span style={{ marginLeft: 8, color: "#8c8c8c" }}>Level {entry.level}</span>
              {entry.status && (
                <Tag
                  color={STATUS_COLORS[entry.status] ?? "default"}
                  style={{ marginLeft: 8 }}
                >
                  {entry.status}
                </Tag>
              )}
              {entry.actionAt && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {dayjs(entry.actionAt).format("DD MMM YYYY, hh:mm A")}
                </Text>
              )}
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default ApproverChainPanel;
