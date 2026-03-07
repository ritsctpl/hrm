import { PolicyDocument, PolicyVersion, AcknowledgmentReport, PolicyCategory } from "./domain.types";

export interface PolicyCardProps {
  policy: PolicyDocument;
  onClick: (policy: PolicyDocument) => void;
}

export interface PolicyListRowProps {
  policy: PolicyDocument;
  onClick: (policy: PolicyDocument) => void;
  onEdit?: (policy: PolicyDocument) => void;
  onPublish?: (policyId: string) => void;
  onArchive?: (policyId: string) => void;
}

export interface VersionHistoryItemProps {
  version: PolicyVersion;
  isCurrent?: boolean;
  onDownload?: (version: PolicyVersion) => void;
}

export interface PolicyContentRendererProps {
  content?: string;
  attachmentUrl?: string;
  contentType?: "html" | "pdf";
}

export interface AcknowledgmentTrackerProps {
  report: AcknowledgmentReport;
  loading?: boolean;
  onSendReminder?: () => void;
  onViewFullReport?: () => void;
}

export interface PolicyFormDrawerProps {
  open: boolean;
  editPolicy?: PolicyDocument | null;
  categories: PolicyCategory[];
  site: string;
  onClose: () => void;
  onSaved: () => void;
}

export interface PolicyAdminTableProps {
  policies: PolicyDocument[];
  loading: boolean;
  onEdit: (policy: PolicyDocument) => void;
  onPublish: (policyId: string) => void;
  onArchive: (policyId: string) => void;
  onViewDetail: (policy: PolicyDocument) => void;
}

export interface PolicySearchBarProps {
  categories: PolicyCategory[];
  onSearch: (params: { searchText: string; categoryId: string; docType: string; status: string }) => void;
}
