import { useEffect, useMemo } from 'react';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';

/**
 * Hook to manage Organization module permissions
 * Loads and provides access to all 9 object permissions
 */
export const useOrganizationPermissions = () => {
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const sectionPerms = useHrmRbacStore(s => s.getSectionPermissions('HRM_ORGANIZATION'));
  const isReady = useHrmRbacStore(s => s.isReady);

  // Load permissions on mount
  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_ORGANIZATION');
    }
  }, [isReady, loadSectionPermissions]);

  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    // Profile Tab Objects (5)
    const identityPerms = sectionPerms?.['identity'];
    const statutoryPerms = sectionPerms?.['statutory'];
    const addressesPerms = sectionPerms?.['addresses'];
    const bankAccountsPerms = sectionPerms?.['bankAccounts'];
    const financialYearPerms = sectionPerms?.['financialYear'];

    // Other Tab Objects (4)
    const businessUnitPerms = sectionPerms?.['businessUnit'];
    const departmentPerms = sectionPerms?.['department'];
    const designationPerms = sectionPerms?.['designation'];
    const locationPerms = sectionPerms?.['location'];

    return {
      // Identity permissions
      canViewIdentity: identityPerms?.canView ?? false,
      canAddIdentity: identityPerms?.canAdd ?? false,
      canEditIdentity: identityPerms?.canEdit ?? false,
      canDeleteIdentity: identityPerms?.canDelete ?? false,

      // Statutory permissions
      canViewStatutory: statutoryPerms?.canView ?? false,
      canAddStatutory: statutoryPerms?.canAdd ?? false,
      canEditStatutory: statutoryPerms?.canEdit ?? false,
      canDeleteStatutory: statutoryPerms?.canDelete ?? false,

      // Addresses permissions
      canViewAddresses: addressesPerms?.canView ?? false,
      canAddAddresses: addressesPerms?.canAdd ?? false,
      canEditAddresses: addressesPerms?.canEdit ?? false,
      canDeleteAddresses: addressesPerms?.canDelete ?? false,

      // Bank Accounts permissions
      canViewBankAccounts: bankAccountsPerms?.canView ?? false,
      canAddBankAccounts: bankAccountsPerms?.canAdd ?? false,
      canEditBankAccounts: bankAccountsPerms?.canEdit ?? false,
      canDeleteBankAccounts: bankAccountsPerms?.canDelete ?? false,

      // Financial Year permissions
      canViewFinancialYear: financialYearPerms?.canView ?? false,
      canAddFinancialYear: financialYearPerms?.canAdd ?? false,
      canEditFinancialYear: financialYearPerms?.canEdit ?? false,
      canDeleteFinancialYear: financialYearPerms?.canDelete ?? false,

      // Business Unit permissions
      canViewBusinessUnit: businessUnitPerms?.canView ?? false,
      canAddBusinessUnit: businessUnitPerms?.canAdd ?? false,
      canEditBusinessUnit: businessUnitPerms?.canEdit ?? false,
      canDeleteBusinessUnit: businessUnitPerms?.canDelete ?? false,

      // Department permissions
      canViewDepartment: departmentPerms?.canView ?? false,
      canAddDepartment: departmentPerms?.canAdd ?? false,
      canEditDepartment: departmentPerms?.canEdit ?? false,
      canDeleteDepartment: departmentPerms?.canDelete ?? false,

      // Designation permissions
      canViewDesignation: designationPerms?.canView ?? false,
      canAddDesignation: designationPerms?.canAdd ?? false,
      canEditDesignation: designationPerms?.canEdit ?? false,
      canDeleteDesignation: designationPerms?.canDelete ?? false,

      // Location permissions
      canViewLocation: locationPerms?.canView ?? false,
      canAddLocation: locationPerms?.canAdd ?? false,
      canEditLocation: locationPerms?.canEdit ?? false,
      canDeleteLocation: locationPerms?.canDelete ?? false,

      // Helper: Check if Profile tab should be visible
      canViewProfileTab: [
        identityPerms?.canView,
        statutoryPerms?.canView,
        addressesPerms?.canView,
        bankAccountsPerms?.canView,
        financialYearPerms?.canView,
      ].some(Boolean),

      // Raw permissions for advanced use
      raw: sectionPerms,
    };
  }, [sectionPerms]);

  return permissions;
};
