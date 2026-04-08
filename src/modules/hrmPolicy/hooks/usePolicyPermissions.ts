/**
 * HRM Policy Module - Permissions Hook
 * Uses RBAC effective permissions for granular access control
 */

import { usePermissionsStore } from '@/stores/permissionsStore';

export const usePolicyPermissions = () => {
  const { hasPermission } = usePermissionsStore();
  const moduleCode = 'HRM_POLICY';

  return {
    // Policy Document
    canViewPolicies: hasPermission(moduleCode, 'policyDocument', 'VIEW'),
    canCreatePolicy: hasPermission(moduleCode, 'policyDocument', 'ADD'),
    canEditPolicy: hasPermission(moduleCode, 'policyDocument', 'EDIT'),
    canDeletePolicy: hasPermission(moduleCode, 'policyDocument', 'DELETE'),

    // Policy Category
    canViewCategories: hasPermission(moduleCode, 'policyCategory', 'VIEW'),
    canCreateCategory: hasPermission(moduleCode, 'policyCategory', 'ADD'),
    canEditCategory: hasPermission(moduleCode, 'policyCategory', 'EDIT'),
    canDeleteCategory: hasPermission(moduleCode, 'policyCategory', 'DELETE'),

    // Policy Version
    canViewVersions: hasPermission(moduleCode, 'policyVersion', 'VIEW'),
    canCreateVersion: hasPermission(moduleCode, 'policyVersion', 'ADD'),
    canEditVersion: hasPermission(moduleCode, 'policyVersion', 'EDIT'),
    canDeleteVersion: hasPermission(moduleCode, 'policyVersion', 'DELETE'),

    // Policy Acknowledgment
    canViewAcknowledgments: hasPermission(moduleCode, 'policyAcknowledgment', 'VIEW'),
    canAcknowledgePolicy: hasPermission(moduleCode, 'policyAcknowledgment', 'ADD'),
    canEditAcknowledgment: hasPermission(moduleCode, 'policyAcknowledgment', 'EDIT'),
    canDeleteAcknowledgment: hasPermission(moduleCode, 'policyAcknowledgment', 'DELETE'),

    // Policy Approval
    canViewApprovals: hasPermission(moduleCode, 'policyApproval', 'VIEW'),
    canSubmitForApproval: hasPermission(moduleCode, 'policyApproval', 'ADD'),
    canApprovePolicy: hasPermission(moduleCode, 'policyApproval', 'EDIT'),
    canCancelApproval: hasPermission(moduleCode, 'policyApproval', 'DELETE'),

    // Policy Distribution
    canViewDistribution: hasPermission(moduleCode, 'policyDistribution', 'VIEW'),
    canAssignPolicy: hasPermission(moduleCode, 'policyDistribution', 'ADD'),
    canEditDistribution: hasPermission(moduleCode, 'policyDistribution', 'EDIT'),
    canRemoveAssignment: hasPermission(moduleCode, 'policyDistribution', 'DELETE'),

    // Policy Audit Log
    canViewAuditLog: hasPermission(moduleCode, 'policyAuditLog', 'VIEW'),
    canCreateAuditEntry: hasPermission(moduleCode, 'policyAuditLog', 'ADD'),
    canEditAuditLog: hasPermission(moduleCode, 'policyAuditLog', 'EDIT'),
    canDeleteAuditLog: hasPermission(moduleCode, 'policyAuditLog', 'DELETE'),

    // Policy Template
    canViewTemplates: hasPermission(moduleCode, 'policyTemplate', 'VIEW'),
    canCreateTemplate: hasPermission(moduleCode, 'policyTemplate', 'ADD'),
    canEditTemplate: hasPermission(moduleCode, 'policyTemplate', 'EDIT'),
    canDeleteTemplate: hasPermission(moduleCode, 'policyTemplate', 'DELETE'),

    // Policy Attachment
    canViewAttachments: hasPermission(moduleCode, 'policyAttachment', 'VIEW'),
    canUploadAttachment: hasPermission(moduleCode, 'policyAttachment', 'ADD'),
    canReplaceAttachment: hasPermission(moduleCode, 'policyAttachment', 'EDIT'),
    canDeleteAttachment: hasPermission(moduleCode, 'policyAttachment', 'DELETE'),

    // Policy Reminder
    canViewReminders: hasPermission(moduleCode, 'policyReminder', 'VIEW'),
    canSendReminder: hasPermission(moduleCode, 'policyReminder', 'ADD'),
    canEditReminder: hasPermission(moduleCode, 'policyReminder', 'EDIT'),
    canCancelReminder: hasPermission(moduleCode, 'policyReminder', 'DELETE'),

    // Composite permissions for common use cases
    canAdminPolicies: hasPermission(moduleCode, 'policyDocument', 'EDIT') && 
                      hasPermission(moduleCode, 'policyApproval', 'EDIT'),
    canManageCategories: hasPermission(moduleCode, 'policyCategory', 'ADD') && 
                         hasPermission(moduleCode, 'policyCategory', 'EDIT'),
    canManageDistribution: hasPermission(moduleCode, 'policyDistribution', 'ADD') && 
                           hasPermission(moduleCode, 'policyDistribution', 'EDIT'),
  };
};
