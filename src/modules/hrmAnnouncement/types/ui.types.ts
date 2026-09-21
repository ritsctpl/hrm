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
  /**
   * Deletes the open draft — the landing's own delete handler, shared with the Admin row.
   * Resolves true on success, when the drawer closes itself.
   */
  onDelete?: (announcement: Announcement) => Promise<boolean>;
}
