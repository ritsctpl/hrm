"use client";

import React from "react";
import { Result } from "antd";
import { useCan } from "../../../hrmAccess/hooks/useCan";

interface PermissionGateProps {
  children: React.ReactNode;
  /** The object code to check permissions for */
  object: string;
  /** Required permission action */
  action: "view" | "add" | "edit" | "delete";
  /** Fallback content when permission is denied */
  fallback?: React.ReactNode;
  /** Show access denied message instead of hiding content */
  showDenied?: boolean;
}

/**
 * Permission gate component that controls access to UI sections based on RBAC permissions.
 * 
 * Usage:
 * <PermissionGate object="leave_request" action="view">
 *   <LeaveRequestsTable />
 * </PermissionGate>
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  object,
  action,
  fallback,
  showDenied = false,
}) => {
  const permissions = useCan("HRM_LEAVE", object);
  
  const hasPermission = (() => {
    switch (action) {
      case "view":
        return permissions.canView;
      case "add":
        return permissions.canAdd;
      case "edit":
        return permissions.canEdit;
      case "delete":
        return permissions.canDelete;
      default:
        return false;
    }
  })();

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showDenied) {
      return (
        <Result
          status="403"
          title="Access Denied"
          subTitle="You don't have permission to access this section."
        />
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

export default PermissionGate;