import api from "@/services/api";
import {
  GetPoliciesPayload,
  GetPolicyDetailPayload,
  GetPolicyByCodePayload,
  AcknowledgePolicyPayload,
  WaiveAcknowledgmentPayload,
  CreatePolicyPayload,
  UpdatePolicyPayload,
  UpdatePdfPayload,
  PublishPolicyPayload,
  SubmitForReviewPayload,
  ApprovePolicyPayload,
  RetirePolicyPayload,
  SupersedePolicyPayload,
  DeletePolicyPayload,
  GetVersionHistoryPayload,
  GetAcknowledgmentReportPayload,
  GetEmployeeAcknowledgmentsPayload,
  GetMyPoliciesPayload,
  GetEmployeePolicyPortalPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  DeleteCategoryPayload,
  DownloadPolicyFilePayload,
} from "../types/api.types";
import {
  PolicyDocument,
  PolicyCategory,
  PolicyVersion,
  AcknowledgmentReport,
  AcknowledgmentRecord,
  EmployeePolicyPortal,
} from "../types/domain.types";

const BASE = "/hrm-service/policy";

export class HrmPolicyService {
  // ── Policy CRUD ──

  static async getPolicies(payload: GetPoliciesPayload): Promise<PolicyDocument[]> {
    const res = await api.post(`${BASE}/listPolicies`, payload);
    return res.data ?? [];
  }

  static async getPolicyDetail(payload: GetPolicyDetailPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/getPolicy`, payload);
    return res.data;
  }

  static async getPolicyByCode(payload: GetPolicyByCodePayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/getPolicyByCode`, payload);
    return res.data;
  }

  static async createPolicy(payload: CreatePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/createPolicy`, payload);
    return res.data;
  }

  static async updatePolicy(payload: UpdatePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/updatePolicy`, payload);
    return res.data;
  }

  static async updatePdf(payload: UpdatePdfPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/updatePdf`, payload);
    return res.data;
  }

  static async deletePolicy(payload: DeletePolicyPayload): Promise<void> {
    await api.post(`${BASE}/deletePolicy`, payload);
  }

  // ── Workflow ──

  static async submitForReview(payload: SubmitForReviewPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/submitForReview`, payload);
    return res.data;
  }

  static async approvePolicy(payload: ApprovePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/approvePolicy`, payload);
    return res.data;
  }

  static async publishPolicy(payload: PublishPolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/publishPolicy`, payload);
    return res.data;
  }

  static async retirePolicy(payload: RetirePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/retirePolicy`, payload);
    return res.data;
  }

  static async supersedePolicy(payload: SupersedePolicyPayload): Promise<PolicyDocument> {
    const res = await api.post(`${BASE}/supersedePolicy`, payload);
    return res.data;
  }

  // ── Version Management ──

  static async getVersionHistory(payload: GetVersionHistoryPayload): Promise<PolicyVersion[]> {
    const res = await api.post(`${BASE}/getVersionHistory`, payload);
    return res.data ?? [];
  }

  static async uploadPolicyFile(
    site: string,
    policyHandle: string,
    uploadedBy: string,
    file: File
  ): Promise<PolicyDocument> {
    const formData = new FormData();
    formData.append("site", site);
    formData.append("policyHandle", policyHandle);
    formData.append("uploadedBy", uploadedBy);
    formData.append("file", file);
    const res = await api.post(`${BASE}/uploadPolicyFile`, formData);
    return res.data;
  }

  static async uploadNewVersion(
    site: string,
    policyHandle: string,
    newVersionNumber: string,
    changeDescription: string,
    uploadedBy: string,
    file?: File
  ): Promise<PolicyDocument> {
    const formData = new FormData();
    formData.append("site", site);
    formData.append("policyHandle", policyHandle);
    formData.append("newVersionNumber", newVersionNumber);
    formData.append("changeDescription", changeDescription);
    formData.append("uploadedBy", uploadedBy);
    if (file) formData.append("file", file);
    const res = await api.post(`${BASE}/uploadNewVersion`, formData);
    return res.data;
  }

  static async downloadPolicyFile(payload: DownloadPolicyFilePayload): Promise<Blob> {
    const res = await api.post(`${BASE}/downloadPolicyFile`, payload, { responseType: "blob" });
    return res.data as Blob;
  }

  // ── Acknowledgment ──

  static async acknowledgePolicy(payload: AcknowledgePolicyPayload): Promise<AcknowledgmentRecord> {
    const res = await api.post(`${BASE}/acknowledgePolicy`, payload);
    return res.data;
  }

  static async waiveAcknowledgment(payload: WaiveAcknowledgmentPayload): Promise<AcknowledgmentRecord> {
    const res = await api.post(`${BASE}/waiveAcknowledgment`, payload);
    return res.data;
  }

  static async getAcknowledgmentReport(payload: GetAcknowledgmentReportPayload): Promise<AcknowledgmentReport> {
    const res = await api.post(`${BASE}/getAcknowledgmentReport`, payload);
    return res.data;
  }

  static async getEmployeeAcknowledgments(payload: GetEmployeeAcknowledgmentsPayload): Promise<AcknowledgmentRecord[]> {
    const res = await api.post(`${BASE}/getEmployeeAcknowledgments`, payload);
    return res.data ?? [];
  }

  // ── Employee Self-Service ──

  static async getMyPolicies(payload: GetMyPoliciesPayload): Promise<PolicyDocument[]> {
    const res = await api.post(`${BASE}/getMyPolicies`, payload);
    return res.data ?? [];
  }

  static async getEmployeePolicyPortal(payload: GetEmployeePolicyPortalPayload): Promise<EmployeePolicyPortal> {
    const res = await api.post(`${BASE}/getEmployeePolicyPortal`, payload);
    return res.data;
  }

  // ── Categories ──

  static async getCategories(site: string): Promise<PolicyCategory[]> {
    const res = await api.post(`${BASE}/listCategories`, { site });
    return res.data ?? [];
  }

  static async createCategory(payload: CreateCategoryPayload): Promise<PolicyCategory> {
    const res = await api.post(`${BASE}/createCategory`, payload);
    return res.data;
  }

  static async updateCategory(payload: UpdateCategoryPayload): Promise<PolicyCategory> {
    const res = await api.post(`${BASE}/updateCategory`, payload);
    return res.data;
  }

  static async deleteCategory(payload: DeleteCategoryPayload): Promise<void> {
    await api.post(`${BASE}/deleteCategory`, payload);
  }
}
