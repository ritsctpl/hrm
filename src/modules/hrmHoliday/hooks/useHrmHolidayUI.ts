/**
 * HRM Holiday Module - UI State Hooks
 */

import { useHrmHolidayStore } from '../stores/hrmHolidayStore';

export function useHrmHolidayUI() {
  const store = useHrmHolidayStore();

  return {
    activeTab: store.activeTab,
    showHolidayForm: store.showHolidayForm,
    showBuMapping: store.showBuMapping,
    showImport: store.showImport,
    showGroupCreateModal: store.showGroupCreateModal,
    showDuplicateModal: store.showDuplicateModal,
    showPublishModal: store.showPublishModal,
    showLockModal: store.showLockModal,
    showUnlockModal: store.showUnlockModal,
    editingHoliday: store.editingHoliday,
    categoryFilter: store.categoryFilter,
    monthFilter: store.monthFilter,

    setActiveTab: store.setActiveTab,
    openHolidayForm: store.openHolidayForm,
    closeHolidayForm: store.closeHolidayForm,
    openBuMapping: store.openBuMapping,
    closeBuMapping: store.closeBuMapping,
    openImport: store.openImport,
    closeImport: store.closeImport,
    openGroupCreateModal: store.openGroupCreateModal,
    closeGroupCreateModal: store.closeGroupCreateModal,
    openDuplicateModal: store.openDuplicateModal,
    closeDuplicateModal: store.closeDuplicateModal,
    openPublishModal: store.openPublishModal,
    closePublishModal: store.closePublishModal,
    openLockModal: store.openLockModal,
    closeLockModal: store.closeLockModal,
    openUnlockModal: store.openUnlockModal,
    closeUnlockModal: store.closeUnlockModal,
    setCategoryFilter: store.setCategoryFilter,
    setMonthFilter: store.setMonthFilter,
  };
}
