"use client";

import { useCallback } from "react";
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
  const site = cookies.site ?? "";
  const employeeId = cookies.userId ?? "";

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await HrmPolicyService.getCategories(site);
      setCategories(data);
    } catch {
      message.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, [site]);

  const loadPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    try {
      const data = await HrmPolicyService.getPolicies({
        site,
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
  }, [site, libraryFilterCategoryId, libraryFilterDocType]);

  const loadAdminPolicies = useCallback(async () => {
    setAdminPoliciesLoading(true);
    try {
      const data = await HrmPolicyService.getPolicies({ 
        site,
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
  }, [site, adminFilterCategoryId, adminFilterDocType, adminFilterStatus]);

  const loadVersionHistory = useCallback(async (policyHandle: string) => {
    setVersionHistoryLoading(true);
    try {
      const data = await HrmPolicyService.getVersionHistory({ site, policyHandle });
      setVersionHistory(data);
    } catch {
      message.error("Failed to load version history");
    } finally {
      setVersionHistoryLoading(false);
    }
  }, [site]);

  const loadAckReport = useCallback(async (policyHandle: string) => {
    setAckReportLoading(true);
    try {
      const data = await HrmPolicyService.getAcknowledgmentReport({ site, policyHandle });
      setAckReport(data);
    } catch {
      message.error("Failed to load acknowledgment report");
    } finally {
      setAckReportLoading(false);
    }
  }, [site]);

  return {
    site,
    employeeId,
    loadCategories,
    loadPolicies,
    loadAdminPolicies,
    loadVersionHistory,
    loadAckReport,
  };
};
