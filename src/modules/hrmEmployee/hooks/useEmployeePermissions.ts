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
 */
export const useEmployeePermissions = () => {
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const sectionPerms = useHrmRbacStore(s => s.getSectionPermissions('HRM_EMPLOYEE'));
  const isReady = useHrmRbacStore(s => s.isReady);

  // Load permissions on mount
  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_EMPLOYEE');
    }
  }, [isReady, loadSectionPermissions]);

  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    // Extract object permissions
    const employeePerms = sectionPerms?.['employee'];
    const personalDetailsPerms = sectionPerms?.['personalDetails'];
    const officialDetailsPerms = sectionPerms?.['officialDetails'];
    const employmentDetailsPerms = sectionPerms?.['employmentDetails'];
    const compensationPerms = sectionPerms?.['compensation'];
    const bankDetailsPerms = sectionPerms?.['bankDetails'];
    const documentsPerms = sectionPerms?.['documents'];
    const emergencyContactPerms = sectionPerms?.['emergencyContact'];
    const familyDetailsPerms = sectionPerms?.['familyDetails'];
    const educationPerms = sectionPerms?.['education'];
    const experiencePerms = sectionPerms?.['experience'];
    const reportingStructurePerms = sectionPerms?.['reportingStructure'];

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
