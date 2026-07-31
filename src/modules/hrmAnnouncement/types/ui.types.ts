import { Announcement } from "./domain.types";

export interface AnnouncementListRowProps {
  announcement: Announcement;
  onClick: (announcement: Announcement) => void;
  onMarkRead?: (handle: string) => void;
}

export interface AnnouncementDetailPanelProps {
  announcement: Announcement;
  onClose: () => void;
  onMarkRead?: (handle: string) => void;
  /** ANNOUNCEMENT_APPROVE_TOP — gates the Ratify / Refuse actions. */
  canRatify?: boolean;
  onRatify?: () => void;
  onRefuseRatification?: () => void;
}

export interface AnnouncementComposeDrawerProps {
  open: boolean;
  editAnnouncement?: Announcement | null;
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}
