"use client";

import { useCallback } from "react";
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmPolicyService } from "../services/hrmPolicyService";
import { useHrmPolicyStore } from "../stores/hrmPolicyStore";

export const useHrmPolicyData = () => {
  const {
    searchText,
    filterCategoryId,
    filterDocType,
    filterStatus,
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
  const site = cookies.site ?? "RITS";
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
        categoryHandle: filterCategoryId || undefined,
        documentType: filterDocType as never || undefined,
        status: filterStatus as never || undefined,
      });
      setPolicies(data);
    } catch {
      message.error("Failed to load policies");
    } finally {
      setPoliciesLoading(false);
    }
  }, [site, filterCategoryId, filterDocType, filterStatus, searchText]);

  const loadAdminPolicies = useCallback(async () => {
    setAdminPoliciesLoading(true);
    try {
      const data = await HrmPolicyService.getPolicies({ site });
      setAdminPolicies(data);
    } catch {
      message.error("Failed to load admin policies");
    } finally {
      setAdminPoliciesLoading(false);
    }
  }, [site]);

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
