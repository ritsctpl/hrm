"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmPolicyService } from "../services/hrmPolicyService";
import { useHrmPolicyStore } from "../stores/hrmPolicyStore";

export const useHrmPolicyData = () => {
  const {
    libraryFilterCategoryId,
    libraryFilterDocType,
    adminFilterCategoryId,
    adminFilterDocType,
    adminFilterStatus,
    setPolicies,
    setPoliciesLoading,
    setCategories,
    setCategoriesLoading,
    setAdminPolicies,
    setAdminPoliciesLoading,
    setVersionHistory,
    setVersionHistoryLoading,
    setAckReport,
    setAckReportLoading,
  } = useHrmPolicyStore();

  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId = cookies.userId ?? "";

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await HrmPolicyService.getCategories(organizationId);
      setCategories(data);
    } catch {
      message.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, [organizationId]);

  const loadPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    try {
      const data = await HrmPolicyService.getPolicies({ organizationId,
        categoryHandle: libraryFilterCategoryId || undefined,
        documentType: libraryFilterDocType as never || undefined,
        status: "PUBLISHED" as never,  // Library always shows Published
        sortBy: "publishedDateTime",
        sortOrder: "DESC",
      });
      setPolicies(data);
    } catch {
      message.error("Failed to load policies");
    } finally {
      setPoliciesLoading(false);
    }
  }, [organizationId, libraryFilterCategoryId, libraryFilterDocType]);

  const loadAdminPolicies = useCallback(async () => {
    setAdminPoliciesLoading(true);
    try {
      const data = await HrmPolicyService.getPolicies({ organizationId,
        categoryHandle: adminFilterCategoryId || undefined,
        documentType: adminFilterDocType as never || undefined,
        status: adminFilterStatus as never || undefined,
        sortBy: "publishedDateTime",
        sortOrder: "DESC",
      });
      setAdminPolicies(data);
    } catch {
      message.error("Failed to load admin policies");
    } finally {
      setAdminPoliciesLoading(false);
    }
  }, [organizationId, adminFilterCategoryId, adminFilterDocType, adminFilterStatus]);

  const loadVersionHistory = useCallback(async (policyHandle: string) => {
    setVersionHistoryLoading(true);
    try {
      const data = await HrmPolicyService.getVersionHistory({ organizationId, policyHandle });
      setVersionHistory(data);
    } catch {
      message.error("Failed to load version history");
    } finally {
      setVersionHistoryLoading(false);
    }
  }, [organizationId]);

  const loadAckReport = useCallback(async (policyHandle: string) => {
    setAckReportLoading(true);
    try {
      const data = await HrmPolicyService.getAcknowledgmentReport({ organizationId, policyHandle });
      setAckReport(data);
    } catch {
      message.error("Failed to load acknowledgment report");
    } finally {
      setAckReportLoading(false);
    }
  }, [organizationId]);

  return {
    organizationId,
    employeeId,
    loadCategories,
    loadPolicies,
    loadAdminPolicies,
    loadVersionHistory,
    loadAckReport,
  };
};
