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

const BASE = "app/v1/hrm-service/policy";

export class HrmPolicyService {
  static async getPolicies(payload: GetPoliciesPayload): Promise<PolicyDocument[]> {
    const res = await api.post(`${BASE}/search`, payload);
    return res.data;
  }

  static async getPolicyDetail(payload: GetPolicyDetailPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/detail`, payload);
    return res.data;
  }

  static async getCategories(site: string): Promise<PolicyCategory[]> {
    const res = await api.post(`${BASE}/categories`, { site });
    return res.data;
  }

  static async getVersionHistory(payload: GetVersionHistoryPayload): Promise<PolicyVersion[]> {
    const res = await api.post(`${BASE}/version-history`, payload);
    return res.data;
  }

  static async acknowledgePolicy(payload: AcknowledgePolicyPayload): Promise<void> {
    await api.post(`${BASE}/acknowledge`, payload);
  }

  static async createPolicy(payload: CreatePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/create`, payload);
    return res.data;
  }

  static async updatePolicy(payload: UpdatePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/update`, payload);
    return res.data;
  }

  static async publishPolicy(payload: PolicyActionPayload): Promise<void> {
    await api.post(`${BASE}/publish`, payload);
  }

  static async archivePolicy(payload: PolicyActionPayload): Promise<void> {
    await api.post(`${BASE}/archive`, payload);
  }

  static async getAcknowledgmentReport(payload: GetAcknowledgmentReportPayload): Promise<AcknowledgmentReport> {
    const res = await api.post(`${BASE}/ack-report`, payload);
    return res.data;
  }

  static async sendReminder(payload: SendReminderPayload): Promise<void> {
    await api.post(`${BASE}/send-reminder`, payload);
  }
}
