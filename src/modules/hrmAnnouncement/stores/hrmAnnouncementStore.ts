import { create } from "zustand";
import { Announcement, EngagementStats } from "../types/domain.types";

interface HrmAnnouncementState {
  feed: Announcement[];
  pinnedAnnouncements: Announcement[];
  adminAnnouncements: Announcement[];
  selectedAnnouncement: Announcement | null;
  engagementStats: EngagementStats | null;

  feedLoading: boolean;
  adminLoading: boolean;
  engagementLoading: boolean;
  saving: boolean;
  publishing: boolean;
  withdrawing: boolean;

  activeTab: "feed" | "admin";
  showDetailPanel: boolean;
  showComposeDrawer: boolean;
  editAnnouncement: Announcement | null;
  filterCategory: string;
  filterPriority: string;

  setFeed: (items: Announcement[]) => void;
  setPinnedAnnouncements: (items: Announcement[]) => void;
  setAdminAnnouncements: (items: Announcement[]) => void;
  setSelectedAnnouncement: (item: Announcement | null) => void;
  setEngagementStats: (stats: EngagementStats | null) => void;

  setFeedLoading: (v: boolean) => void;
  setAdminLoading: (v: boolean) => void;
  setEngagementLoading: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setPublishing: (v: boolean) => void;
  setWithdrawing: (v: boolean) => void;

  setActiveTab: (tab: "feed" | "admin") => void;
  openDetailPanel: (announcement: Announcement) => void;
  closeDetailPanel: () => void;
  openComposeDrawer: (announcement?: Announcement | null) => void;
  closeComposeDrawer: () => void;
  setFilterCategory: (category: string) => void;
  setFilterPriority: (priority: string) => void;
  markAsRead: (handle: string) => void;
}

export const useHrmAnnouncementStore = create<HrmAnnouncementState>((set) => ({
  feed: [],
  pinnedAnnouncements: [],
  adminAnnouncements: [],
  selectedAnnouncement: null,
  engagementStats: null,
  feedLoading: false,
  adminLoading: false,
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

  setFeed: (feed) => set({ feed }),
  setPinnedAnnouncements: (pinnedAnnouncements) => set({ pinnedAnnouncements }),
  setAdminAnnouncements: (adminAnnouncements) => set({ adminAnnouncements }),
  setSelectedAnnouncement: (selectedAnnouncement) => set({ selectedAnnouncement }),
  setEngagementStats: (engagementStats) => set({ engagementStats }),
  setFeedLoading: (feedLoading) => set({ feedLoading }),
  setAdminLoading: (adminLoading) => set({ adminLoading }),
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
  markAsRead: (handle) =>
    set((s) => ({
      feed: s.feed.map((a) => (a.handle === handle ? { ...a, isRead: true } : a)),
      pinnedAnnouncements: s.pinnedAnnouncements.map((a) =>
        a.handle === handle ? { ...a, isRead: true } : a
      ),
    })),
}));
