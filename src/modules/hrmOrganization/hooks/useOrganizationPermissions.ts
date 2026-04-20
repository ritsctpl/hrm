import { useEffect, useMemo } from 'react';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';

/**
 * Hook to manage Organization module permissions
 * Uses backend object names from moduleObjectRegistry.
 */
export const useOrganizationPermissions = () => {
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const sectionPerms = useHrmRbacStore(s => s.getSectionPermissions('HRM_ORGANIZATION'));
  const moduleLevelPerms = useHrmRbacStore(s => s.permissionsByModule['HRM_ORGANIZATION']);
  const isReady = useHrmRbacStore(s => s.isReady);

  // Load permissions on mount
  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_ORGANIZATION');
    }
  }, [isReady, loadSectionPermissions]);

  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    const DENIED = { canView: false, canAdd: false, canEdit: false, canDelete: false };

    const moduleFallback = {
      canView: moduleLevelPerms?.canView ?? false,
      canAdd: moduleLevelPerms?.canAdd ?? false,
      canEdit: moduleLevelPerms?.canEdit ?? false,
      canDelete: moduleLevelPerms?.canDelete ?? false,
    };

    // Root cascade is handled in loadSectionPermissions — strict lookup is safe.
    const resolveObject = (objectName: string) => {
      if (sectionPerms) {
        return sectionPerms[objectName] || DENIED;
      }
      return moduleFallback;
    };

    // Use backend object names from moduleObjectRegistry
    const identityPerms = resolveObject('org_identity');
    const statutoryPerms = resolveObject('org_statutory');
    const addressesPerms = resolveObject('org_addresses');
    const bankAccountsPerms = resolveObject('org_bank_accounts');
    const financialYearPerms = resolveObject('org_financial_year');
    const businessUnitPerms = resolveObject('org_business_unit');
    const departmentPerms = resolveObject('org_department');
    const designationPerms = resolveObject('org_designation');
    const locationPerms = resolveObject('org_location');

    return {
      // Identity permissions
      canViewIdentity: identityPerms.canView,
      canAddIdentity: identityPerms.canAdd,
      canEditIdentity: identityPerms.canEdit,
      canDeleteIdentity: identityPerms.canDelete,

      // Statutory permissions
      canViewStatutory: statutoryPerms.canView,
      canAddStatutory: statutoryPerms.canAdd,
      canEditStatutory: statutoryPerms.canEdit,
      canDeleteStatutory: statutoryPerms.canDelete,

      // Addresses permissions
      canViewAddresses: addressesPerms.canView,
      canAddAddresses: addressesPerms.canAdd,
      canEditAddresses: addressesPerms.canEdit,
      canDeleteAddresses: addressesPerms.canDelete,

      // Bank Accounts permissions
      canViewBankAccounts: bankAccountsPerms.canView,
      canAddBankAccounts: bankAccountsPerms.canAdd,
      canEditBankAccounts: bankAccountsPerms.canEdit,
      canDeleteBankAccounts: bankAccountsPerms.canDelete,

      // Financial Year permissions
      canViewFinancialYear: financialYearPerms.canView,
      canAddFinancialYear: financialYearPerms.canAdd,
      canEditFinancialYear: financialYearPerms.canEdit,
      canDeleteFinancialYear: financialYearPerms.canDelete,

      // Business Unit permissions
      canViewBusinessUnit: businessUnitPerms.canView,
      canAddBusinessUnit: businessUnitPerms.canAdd,
      canEditBusinessUnit: businessUnitPerms.canEdit,
      canDeleteBusinessUnit: businessUnitPerms.canDelete,

      // Department permissions
      canViewDepartment: departmentPerms.canView,
      canAddDepartment: departmentPerms.canAdd,
      canEditDepartment: departmentPerms.canEdit,
      canDeleteDepartment: departmentPerms.canDelete,

      // Designation permissions
      canViewDesignation: designationPerms.canView,
      canAddDesignation: designationPerms.canAdd,
      canEditDesignation: designationPerms.canEdit,
      canDeleteDesignation: designationPerms.canDelete,

      // Location permissions
      canViewLocation: locationPerms.canView,
      canAddLocation: locationPerms.canAdd,
      canEditLocation: locationPerms.canEdit,
      canDeleteLocation: locationPerms.canDelete,

      // Helper: Check if Profile tab should be visible
      canViewProfileTab: [
        identityPerms.canView,
        statutoryPerms.canView,
        addressesPerms.canView,
        bankAccountsPerms.canView,
        financialYearPerms.canView,
      ].some(Boolean),

      // Raw permissions for advanced use
      raw: sectionPerms,
    };
  }, [sectionPerms, moduleLevelPerms]);

  return permissions;
};
