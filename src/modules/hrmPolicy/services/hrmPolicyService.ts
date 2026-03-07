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
} from "../types/api.types";
import { PolicyDocument, PolicyCategory, PolicyVersion, AcknowledgmentReport } from "../types/domain.types";

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
}
