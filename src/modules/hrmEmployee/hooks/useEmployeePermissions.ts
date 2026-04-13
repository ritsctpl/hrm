import { useEffect, useMemo } from 'react';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';

/**
 * Hook to manage Employee module permissions
 * Loads and provides access to all 12 object permissions (48 total flags)
 *
 * Objects:
 * 1. employee - Employee master record (directory access)
 * 2. personalDetails - Name, DOB, gender, marital status
 * 3. officialDetails - Employee code, joining date, department
 * 4. employmentDetails - Employment type, probation, confirmation
 * 5. compensation - Salary, CTC, pay structure
 * 6. bankDetails - Bank account information
 * 7. documents - ID proofs, certificates
 * 8. emergencyContact - Emergency contact information
 * 9. familyDetails - Spouse, children, dependents
 * 10. education - Educational qualifications
 * 11. experience - Work experience history
 * 12. reportingStructure - Reporting manager, hierarchy
 *
 * Fallback semantics:
 *   - If the backend has published per-object grants (sectionPerms is non-empty),
 *     each object check is strict — missing object means no permission.
 *   - If the backend has NOT published per-object grants (sectionPerms is empty
 *     or null), every check falls back to the module-level grant. This keeps
 *     existing module-level admins working until the backend exposes per-object
 *     RBAC for HRM_EMPLOYEE.
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
    const moduleFallback = {
      canView: moduleLevelPerms?.canView ?? false,
      canAdd: moduleLevelPerms?.canAdd ?? false,
      canEdit: moduleLevelPerms?.canEdit ?? false,
      canDelete: moduleLevelPerms?.canDelete ?? false,
    };

    // Per-object resolver:
    //   - If the backend has explicitly returned grants for this object name
    //     (whether allow or deny), use them as-is.
    //   - Otherwise fall back to the module-level grant. This keeps existing
    //     module-wide admins working while the backend incrementally rolls
    //     out per-object permissions for HRM_EMPLOYEE.
    //
    // Note: this hook intentionally uses Karthick's object-name vocabulary
    // (`employee`, `personalDetails`, `compensation`, …). The codebase ALSO
    // has a parallel <Can object="employee_record" …> system using the
    // hrmEmployeeSectionMap names. Both live side-by-side until a single
    // source of truth is consolidated — see TODO below.
    //
    // TODO(rbac-consolidation): Pick ONE pattern (either useCan + <Can> with
    // hrmEmployeeSectionMap, or this hook with Karthick's names) and migrate
    // the rest of the Employee module to it. The dual system is brittle.
    const resolveObject = (objectName: string) => {
      const explicit = sectionPerms?.[objectName];
      if (explicit) return explicit;
      return moduleFallback;
    };

    const employeePerms = resolveObject('employee');
    const personalDetailsPerms = resolveObject('personalDetails');
    const officialDetailsPerms = resolveObject('officialDetails');
    const employmentDetailsPerms = resolveObject('employmentDetails');
    const compensationPerms = resolveObject('compensation');
    const bankDetailsPerms = resolveObject('bankDetails');
    const documentsPerms = resolveObject('documents');
    const emergencyContactPerms = resolveObject('emergencyContact');
    const familyDetailsPerms = resolveObject('familyDetails');
    const educationPerms = resolveObject('education');
    const experiencePerms = resolveObject('experience');
    const reportingStructurePerms = resolveObject('reportingStructure');

    return {
      // Employee (Directory) permissions
      canViewEmployee: employeePerms?.canView ?? false,
      canAddEmployee: employeePerms?.canAdd ?? false,
      canEditEmployee: employeePerms?.canEdit ?? false,
      canDeleteEmployee: employeePerms?.canDelete ?? false,

      // Personal Details permissions
      canViewPersonalDetails: personalDetailsPerms?.canView ?? false,
      canAddPersonalDetails: personalDetailsPerms?.canAdd ?? false,
      canEditPersonalDetails: personalDetailsPerms?.canEdit ?? false,
      canDeletePersonalDetails: personalDetailsPerms?.canDelete ?? false,

      // Official Details permissions
      canViewOfficialDetails: officialDetailsPerms?.canView ?? false,
      canAddOfficialDetails: officialDetailsPerms?.canAdd ?? false,
      canEditOfficialDetails: officialDetailsPerms?.canEdit ?? false,
      canDeleteOfficialDetails: officialDetailsPerms?.canDelete ?? false,

      // Employment Details permissions
      canViewEmploymentDetails: employmentDetailsPerms?.canView ?? false,
      canAddEmploymentDetails: employmentDetailsPerms?.canAdd ?? false,
      canEditEmploymentDetails: employmentDetailsPerms?.canEdit ?? false,
      canDeleteEmploymentDetails: employmentDetailsPerms?.canDelete ?? false,

      // Compensation permissions
      canViewCompensation: compensationPerms?.canView ?? false,
      canAddCompensation: compensationPerms?.canAdd ?? false,
      canEditCompensation: compensationPerms?.canEdit ?? false,
      canDeleteCompensation: compensationPerms?.canDelete ?? false,

      // Bank Details permissions
      canViewBankDetails: bankDetailsPerms?.canView ?? false,
      canAddBankDetails: bankDetailsPerms?.canAdd ?? false,
      canEditBankDetails: bankDetailsPerms?.canEdit ?? false,
      canDeleteBankDetails: bankDetailsPerms?.canDelete ?? false,

      // Documents permissions
      canViewDocuments: documentsPerms?.canView ?? false,
      canAddDocuments: documentsPerms?.canAdd ?? false,
      canEditDocuments: documentsPerms?.canEdit ?? false,
      canDeleteDocuments: documentsPerms?.canDelete ?? false,

      // Emergency Contact permissions
      canViewEmergencyContact: emergencyContactPerms?.canView ?? false,
      canAddEmergencyContact: emergencyContactPerms?.canAdd ?? false,
      canEditEmergencyContact: emergencyContactPerms?.canEdit ?? false,
      canDeleteEmergencyContact: emergencyContactPerms?.canDelete ?? false,

      // Family Details permissions
      canViewFamilyDetails: familyDetailsPerms?.canView ?? false,
      canAddFamilyDetails: familyDetailsPerms?.canAdd ?? false,
      canEditFamilyDetails: familyDetailsPerms?.canEdit ?? false,
      canDeleteFamilyDetails: familyDetailsPerms?.canDelete ?? false,

      // Education permissions
      canViewEducation: educationPerms?.canView ?? false,
      canAddEducation: educationPerms?.canAdd ?? false,
      canEditEducation: educationPerms?.canEdit ?? false,
      canDeleteEducation: educationPerms?.canDelete ?? false,

      // Experience permissions
      canViewExperience: experiencePerms?.canView ?? false,
      canAddExperience: experiencePerms?.canAdd ?? false,
      canEditExperience: experiencePerms?.canEdit ?? false,
      canDeleteExperience: experiencePerms?.canDelete ?? false,

      // Reporting Structure permissions
      canViewReportingStructure: reportingStructurePerms?.canView ?? false,
      canAddReportingStructure: reportingStructurePerms?.canAdd ?? false,
      canEditReportingStructure: reportingStructurePerms?.canEdit ?? false,
      canDeleteReportingStructure: reportingStructurePerms?.canDelete ?? false,

      // Helper: Check if any profile tab should be visible
      canViewAnyProfileTab: [
        personalDetailsPerms?.canView,
        officialDetailsPerms?.canView,
        employmentDetailsPerms?.canView,
        compensationPerms?.canView,
        bankDetailsPerms?.canView,
        documentsPerms?.canView,
        emergencyContactPerms?.canView,
        familyDetailsPerms?.canView,
        educationPerms?.canView,
        experiencePerms?.canView,
        reportingStructurePerms?.canView,
      ].some(Boolean),

      // Raw permissions for advanced use
      raw: sectionPerms,
    };
  }, [sectionPerms]);

  return permissions;
};
