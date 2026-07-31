import { create } from "zustand";
import { Announcement, EngagementStats } from "../types/domain.types";

interface HrmAnnouncementState {
  feed: Announcement[];
  pinnedAnnouncements: Announcement[];
  adminAnnouncements: Announcement[];
  pendingApprovals: Announcement[];
  selectedAnnouncement: Announcement | null;
  engagementStats: EngagementStats | null;

  feedLoading: boolean;
  adminLoading: boolean;
  approvalsLoading: boolean;
  approvalActing: boolean;
  engagementLoading: boolean;
  saving: boolean;
  publishing: boolean;
  withdrawing: boolean;

  activeTab: "feed" | "admin" | "approvals" | "policy";
  showDetailPanel: boolean;
  showComposeDrawer: boolean;
  editAnnouncement: Announcement | null;
  filterCategory: string;
  filterPriority: string;

  /** Withdraw confirmation (design §14.2.1) — reason is entered by the user. */
  isWithdrawConfirmOpen: boolean;
  withdrawTarget: Announcement | null;

  setFeed: (items: Announcement[]) => void;
  setPinnedAnnouncements: (items: Announcement[]) => void;
  setAdminAnnouncements: (items: Announcement[]) => void;
  setPendingApprovals: (items: Announcement[]) => void;
  setSelectedAnnouncement: (item: Announcement | null) => void;
  setEngagementStats: (stats: EngagementStats | null) => void;

  setFeedLoading: (v: boolean) => void;
  setAdminLoading: (v: boolean) => void;
  setApprovalsLoading: (v: boolean) => void;
  setApprovalActing: (v: boolean) => void;
  setEngagementLoading: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setPublishing: (v: boolean) => void;
  setWithdrawing: (v: boolean) => void;

  setActiveTab: (tab: "feed" | "admin" | "approvals" | "policy") => void;
  openDetailPanel: (announcement: Announcement) => void;
  closeDetailPanel: () => void;
  openComposeDrawer: (announcement?: Announcement | null) => void;
  closeComposeDrawer: () => void;
  setFilterCategory: (category: string) => void;
  setFilterPriority: (priority: string) => void;
  markAsRead: (handle: string) => void;
  openWithdrawConfirm: (announcement: Announcement) => void;
  closeWithdrawConfirm: () => void;
}

export const useHrmAnnouncementStore = create<HrmAnnouncementState>((set) => ({
  feed: [],
  pinnedAnnouncements: [],
  adminAnnouncements: [],
  pendingApprovals: [],
  selectedAnnouncement: null,
  engagementStats: null,
  feedLoading: false,
  adminLoading: false,
  approvalsLoading: false,
  approvalActing: false,
  engagementLoading: false,
  saving: false,
  publishing: false,
  withdrawing: false,
  activeTab: "feed",
  showDetailPanel: false,
  showComposeDrawer: false,
  editAnnouncement: null,
  filterCategory: "",
  filterPriority: "",
  isWithdrawConfirmOpen: false,
  withdrawTarget: null,

  setFeed: (feed) => set({ feed }),
  setPinnedAnnouncements: (pinnedAnnouncements) => set({ pinnedAnnouncements }),
  setAdminAnnouncements: (adminAnnouncements) => set({ adminAnnouncements }),
  setPendingApprovals: (pendingApprovals) => set({ pendingApprovals }),
  setSelectedAnnouncement: (selectedAnnouncement) => set({ selectedAnnouncement }),
  setEngagementStats: (engagementStats) => set({ engagementStats }),
  setFeedLoading: (feedLoading) => set({ feedLoading }),
  setAdminLoading: (adminLoading) => set({ adminLoading }),
  setApprovalsLoading: (approvalsLoading) => set({ approvalsLoading }),
  setApprovalActing: (approvalActing) => set({ approvalActing }),
  setEngagementLoading: (engagementLoading) => set({ engagementLoading }),
  setSaving: (saving) => set({ saving }),
  setPublishing: (publishing) => set({ publishing }),
  setWithdrawing: (withdrawing) => set({ withdrawing }),
  setActiveTab: (activeTab) => set({ activeTab }),
  openDetailPanel: (announcement) => set({ showDetailPanel: true, selectedAnnouncement: announcement }),
  closeDetailPanel: () => set({ showDetailPanel: false, selectedAnnouncement: null }),
  openComposeDrawer: (announcement = null) =>
    set({ showComposeDrawer: true, editAnnouncement: announcement }),
  closeComposeDrawer: () => set({ showComposeDrawer: false, editAnnouncement: null }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  openWithdrawConfirm: (withdrawTarget) =>
    set({ isWithdrawConfirmOpen: true, withdrawTarget }),
  closeWithdrawConfirm: () => set({ isWithdrawConfirmOpen: false, withdrawTarget: null }),
  markAsRead: (handle) =>
    set((s) => ({
      feed: s.feed.map((a) => (a.handle === handle ? { ...a, isRead: true } : a)),
      pinnedAnnouncements: s.pinnedAnnouncements.map((a) =>
        a.handle === handle ? { ...a, isRead: true } : a
      ),
    })),
}));
