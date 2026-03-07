import api from "@/services/api";
import {
  GetPoliciesPayload,
  GetPolicyDetailPayload,
  AcknowledgePolicyPayload,
  CreatePolicyPayload,
  UpdatePolicyPayload,
  PolicyActionPayload,
  GetVersionHistoryPayload,
  GetAcknowledgmentReportPayload,
  SendReminderPayload,
  CreateCategoryPayload,
} from "../types/api.types";
import { PolicyDocument, PolicyCategory, PolicyVersion, AcknowledgmentReport, AcknowledgmentRecord } from "../types/domain.types";

const BASE = "/hrm-service/policy";

export class HrmPolicyService {
  static async getPolicies(payload: GetPoliciesPayload): Promise<PolicyDocument[]> {
    const res = await api.post(`${BASE}/listPolicies`, payload);
    return res.data;
  }

  static async getPolicyDetail(payload: GetPolicyDetailPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/getPolicy`, payload);
    return res.data;
  }

  static async getCategories(site: string): Promise<PolicyCategory[]> {
    const res = await api.post(`${BASE}/listCategories`, { site });
    return res.data;
  }

  static async getVersionHistory(payload: GetVersionHistoryPayload): Promise<PolicyVersion[]> {
    const res = await api.post(`${BASE}/getVersionHistory`, payload);
    return res.data;
  }

  static async acknowledgePolicy(payload: AcknowledgePolicyPayload): Promise<void> {
    await api.post(`${BASE}/acknowledgePolicy`, payload);
  }

  static async createPolicy(payload: CreatePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/createPolicy`, payload);
    return res.data;
  }

  static async updatePolicy(payload: UpdatePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/updatePolicy`, payload);
    return res.data;
  }

  static async publishPolicy(payload: PolicyActionPayload): Promise<void> {
    await api.post(`${BASE}/publishPolicy`, payload);
  }

  static async archivePolicy(payload: PolicyActionPayload): Promise<void> {
    await api.post(`${BASE}/supersedePolicy`, payload);
  }

  static async getAcknowledgmentReport(payload: GetAcknowledgmentReportPayload): Promise<AcknowledgmentReport> {
    const res = await api.post(`${BASE}/getAcknowledgmentReport`, payload);
    return res.data;
  }

  static async sendReminder(payload: SendReminderPayload): Promise<void> {
    await api.post(`${BASE}/waiveAcknowledgment`, payload);
  }

  static async submitForReview(
    site: string,
    handle: string,
    submittedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/submitForReview`, { site, handle, submittedBy });
  }

  static async approvePolicy(
    site: string,
    handle: string,
    approvedBy: string,
    comments?: string
  ): Promise<void> {
    await api.post(`${BASE}/approvePolicy`, { site, handle, approvedBy, comments });
  }

  static async retirePolicy(
    site: string,
    handle: string,
    retiredBy: string,
    reason: string
  ): Promise<void> {
    await api.post(`${BASE}/retirePolicy`, { site, handle, retiredBy, reason });
  }

  static async supersedePolicy(
    site: string,
    handle: string,
    newHandle: string,
    supersededBy: string
  ): Promise<void> {
    await api.post(`${BASE}/supersedePolicy`, { site, handle, newHandle, supersededBy });
  }

  static async deletePolicy(
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/deletePolicy`, { site, handle, deletedBy });
  }

  static async getMyPolicies(
    site: string,
    employeeId: string
  ): Promise<PolicyDocument[]> {
    const res = await api.post(`${BASE}/getMyPolicies`, { site, employeeId });
    return res.data;
  }

  static async getEmployeeAcknowledgments(
    site: string,
    policyHandle: string
  ): Promise<AcknowledgmentRecord[]> {
    const res = await api.post(`${BASE}/getEmployeeAcknowledgments`, { site, policyHandle });
    return res.data;
  }

  static async createCategory(payload: CreateCategoryPayload): Promise<PolicyCategory> {
    const res = await api.post(`${BASE}/createCategory`, payload);
    return res.data;
  }
}
