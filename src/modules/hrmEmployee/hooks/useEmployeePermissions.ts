import { useEffect, useMemo } from 'react';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';

/**
 * Hook to manage Employee module permissions
 * Loads and provides access to object-level permissions using the BACKEND
 * object names from moduleObjectRegistry (e.g. `employee_record`,
 * `employee_personal`).
 *
 * Object name mapping (registry → permission flag prefix):
 *   employee_module              → (root object, used for module-level / isAdmin)
 *   employee_record              → Employee
 *   employee_personal            → PersonalDetails
 *   employee_official            → OfficialDetails
 *   employee_contact             → EmergencyContact (contact tab)
 *   employee_compensation        → Compensation
 *   employee_bank                → BankDetails
 *   employee_document            → Documents
 *   employee_education           → Education
 *   employee_skill               → Skills
 *   employee_job_history         → JobHistory
 *   employee_experience          → Experience
 *   employee_training            → Training
 *   employee_asset               → Assets
 *   employee_emergency_contact   → EmergencyContact
 *
 * Fallback semantics:
 *   - If section cache is loaded (non-null), lookup is strict per-object.
 *     Missing object → denied (all false). This enforces object-level RBAC.
 *   - If section cache is NOT loaded yet (null), fall back to module-level
 *     so the UI doesn't flash buttons during initial load.
 */
export const useEmployeePermissions = () => {
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const sectionPerms = useHrmRbacStore(s => s.getSectionPermissions('HRM_EMPLOYEE'));
  const moduleLevelPerms = useHrmRbacStore(s => s.permissionsByModule['HRM_EMPLOYEE']);
  const isReady = useHrmRbacStore(s => s.isReady);

  // Load permissions on mount
  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_EMPLOYEE');
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

    // Root object cascade is handled centrally in loadSectionPermissions.
    // By the time sectionPerms is available, all registered objects already
    // have root perms merged in. Strict lookup is safe here.
    const resolveObject = (objectName: string) => {
      if (sectionPerms) {
        return sectionPerms[objectName] || DENIED;
      }
      return moduleFallback;
    };

    // Resolve each object using the backend object names from moduleObjectRegistry
    const employeePerms = resolveObject('employee_record');
    const personalDetailsPerms = resolveObject('employee_personal');
    const officialDetailsPerms = resolveObject('employee_official');
    const contactPerms = resolveObject('employee_contact');
    const compensationPerms = resolveObject('employee_compensation');
    const bankDetailsPerms = resolveObject('employee_bank');
    const documentsPerms = resolveObject('employee_document');
    const emergencyContactPerms = resolveObject('employee_emergency_contact');
    const educationPerms = resolveObject('employee_education');
    const experiencePerms = resolveObject('employee_experience');
    const skillPerms = resolveObject('employee_skill');
    const jobHistoryPerms = resolveObject('employee_job_history');
    const trainingPerms = resolveObject('employee_training');
    const assetPerms = resolveObject('employee_asset');

    // Legacy: employmentDetails = union of skill / job_history / training / asset.
    // Used for Career tab visibility.
    const employmentDetailsPerms = {
      canView: skillPerms.canView || jobHistoryPerms.canView || trainingPerms.canView || assetPerms.canView,
      canAdd: skillPerms.canAdd || jobHistoryPerms.canAdd || trainingPerms.canAdd || assetPerms.canAdd,
      canEdit: skillPerms.canEdit || jobHistoryPerms.canEdit || trainingPerms.canEdit || assetPerms.canEdit,
      canDelete: skillPerms.canDelete || jobHistoryPerms.canDelete || trainingPerms.canDelete || assetPerms.canDelete,
    };

    return {
      // Employee (Directory) permissions
      canViewEmployee: employeePerms.canView,
      canAddEmployee: employeePerms.canAdd,
      canEditEmployee: employeePerms.canEdit,
      canDeleteEmployee: employeePerms.canDelete,

      // Personal Details permissions
      canViewPersonalDetails: personalDetailsPerms.canView,
      canAddPersonalDetails: personalDetailsPerms.canAdd,
      canEditPersonalDetails: personalDetailsPerms.canEdit,
      canDeletePersonalDetails: personalDetailsPerms.canDelete,

      // Official Details permissions
      canViewOfficialDetails: officialDetailsPerms.canView,
      canAddOfficialDetails: officialDetailsPerms.canAdd,
      canEditOfficialDetails: officialDetailsPerms.canEdit,
      canDeleteOfficialDetails: officialDetailsPerms.canDelete,

      // Employment Details (legacy — union of skill/job_history/training/asset)
      canViewEmploymentDetails: employmentDetailsPerms.canView,
      canAddEmploymentDetails: employmentDetailsPerms.canAdd,
      canEditEmploymentDetails: employmentDetailsPerms.canEdit,
      canDeleteEmploymentDetails: employmentDetailsPerms.canDelete,

      // Skills permissions (object: employee_skill)
      canViewSkills: skillPerms.canView,
      canAddSkills: skillPerms.canAdd,
      canEditSkills: skillPerms.canEdit,
      canDeleteSkills: skillPerms.canDelete,

      // Job History permissions (object: employee_job_history)
      canViewJobHistory: jobHistoryPerms.canView,
      canAddJobHistory: jobHistoryPerms.canAdd,
      canEditJobHistory: jobHistoryPerms.canEdit,
      canDeleteJobHistory: jobHistoryPerms.canDelete,

      // Training permissions (object: employee_training)
      canViewTraining: trainingPerms.canView,
      canAddTraining: trainingPerms.canAdd,
      canEditTraining: trainingPerms.canEdit,
      canDeleteTraining: trainingPerms.canDelete,

      // Asset permissions (object: employee_asset)
      canViewAssets: assetPerms.canView,
      canAddAssets: assetPerms.canAdd,
      canEditAssets: assetPerms.canEdit,
      canDeleteAssets: assetPerms.canDelete,

      // Compensation permissions
      canViewCompensation: compensationPerms.canView,
      canAddCompensation: compensationPerms.canAdd,
      canEditCompensation: compensationPerms.canEdit,
      canDeleteCompensation: compensationPerms.canDelete,

      // Bank Details permissions
      canViewBankDetails: bankDetailsPerms.canView,
      canAddBankDetails: bankDetailsPerms.canAdd,
      canEditBankDetails: bankDetailsPerms.canEdit,
      canDeleteBankDetails: bankDetailsPerms.canDelete,

      // Documents permissions
      canViewDocuments: documentsPerms.canView,
      canAddDocuments: documentsPerms.canAdd,
      canEditDocuments: documentsPerms.canEdit,
      canDeleteDocuments: documentsPerms.canDelete,

      // Emergency Contact permissions
      canViewEmergencyContact: emergencyContactPerms.canView || contactPerms.canView,
      canAddEmergencyContact: emergencyContactPerms.canAdd || contactPerms.canAdd,
      canEditEmergencyContact: emergencyContactPerms.canEdit || contactPerms.canEdit,
      canDeleteEmergencyContact: emergencyContactPerms.canDelete || contactPerms.canDelete,

      // Education permissions
      canViewEducation: educationPerms.canView,
      canAddEducation: educationPerms.canAdd,
      canEditEducation: educationPerms.canEdit,
      canDeleteEducation: educationPerms.canDelete,

      // Experience permissions
      canViewExperience: experiencePerms.canView,
      canAddExperience: experiencePerms.canAdd,
      canEditExperience: experiencePerms.canEdit,
      canDeleteExperience: experiencePerms.canDelete,

      // Helper: Check if any profile tab should be visible
      canViewAnyProfileTab: [
        personalDetailsPerms.canView,
        officialDetailsPerms.canView,
        employmentDetailsPerms.canView,
        compensationPerms.canView,
        bankDetailsPerms.canView,
        documentsPerms.canView,
        emergencyContactPerms.canView || contactPerms.canView,
        educationPerms.canView,
        experiencePerms.canView,
      ].some(Boolean),

      // Raw permissions for advanced use
      raw: sectionPerms,
    };
  }, [sectionPerms, moduleLevelPerms]);

  return permissions;
};
