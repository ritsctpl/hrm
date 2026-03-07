import { Announcement } from "./domain.types";

export interface AnnouncementCardProps {
  announcement: Announcement;
  onClick: (announcement: Announcement) => void;
}

export interface AnnouncementListRowProps {
  announcement: Announcement;
  onClick: (announcement: Announcement) => void;
  onMarkRead?: (announcementId: string) => void;
}

export interface AnnouncementDetailPanelProps {
  announcement: Announcement;
  onClose: () => void;
  onMarkRead?: (announcementId: string) => void;
}

export interface AnnouncementComposeDrawerProps {
  open: boolean;
  editAnnouncement?: Announcement | null;
  site: string;
  onClose: () => void;
  onSaved: () => void;
}
