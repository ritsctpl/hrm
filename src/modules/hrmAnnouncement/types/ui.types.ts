import { Announcement } from "./domain.types";

export interface AnnouncementDetailPanelProps {
  announcement: Announcement;
  onClose: () => void;
  onMarkRead?: (handle: string) => void;
  /** ANNOUNCEMENT_MANAGE — gates the Ratify / Refuse actions. */
  canRatify?: boolean;
  onRatify?: () => void;
  onRefuseRatification?: () => void;
  /** Omitted when the record has no per-employee acknowledgement state. */
  onAcknowledge?: () => void;
  acknowledging?: boolean;
}

export interface AnnouncementComposeDrawerProps {
  open: boolean;
  editAnnouncement?: Announcement | null;
  organizationId: string;
  onClose: () => void;
  onSaved: () => void;
}
