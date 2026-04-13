'use client';

import React from 'react';
import { useCan } from '../hooks/useCan';

export type CanAction = 'view' | 'add' | 'edit' | 'delete';

interface CanProps {
  I: CanAction;
  /** Override module code — defaults to the enclosing <ModuleAccessGate>. */
  on?: string;
  /**
   * Object name within the module for fine-grained permissions.
   * Example: <Can I="add" object="leaveRequest"> for an employee's own
   * leave application, vs <Can I="edit" object="approvalQueue"> for a
   * manager's approve/reject button. Falls back to module-level perms
   * when the object isn't in the loaded section cache.
   */
  object?: string;
  /**
   * Bypass the RBAC check when this is true. Use it to express
   * "self-service" rules where a user can act on their OWN resource
   * even without the global object permission.
   *
   *   const isSelf = useIsSelf(profile.workEmail);
   *   <Can I="edit" object="employee_contact" passIf={isSelf}>
   *     <Button>Edit Contact</Button>
   *   </Can>
   *
   * Semantics: rendered if (RBAC grants the action) OR (passIf is true).
   */
  passIf?: boolean;
  /** Rendered when the user LACKS the permission. Optional. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative permission gate for UI elements.
 *
 * Module-level (most common):
 *   <Can I="add"><Button>Add Foo</Button></Can>
 *   <Can I="edit" fallback={<Tag>Read-only</Tag>}><EditForm/></Can>
 *
 * Object-level (when one module has multiple permission scopes):
 *   <Can I="add" object="leaveRequest"><Button>Apply Leave</Button></Can>
 *   <Can I="edit" object="approvalQueue"><Button>Approve</Button></Can>
 *
 * Cross-module:
 *   <Can I="add" on="HRM_ASSET">...</Can>
 */
const Can: React.FC<CanProps> = ({ I, on, object, passIf, fallback = null, children }) => {
  const perms = useCan(on, object);

  const granted =
    I === 'view' ? perms.canView :
    I === 'add' ? perms.canAdd :
    I === 'edit' ? perms.canEdit :
    I === 'delete' ? perms.canDelete :
    false;

  const allowed = granted || passIf === true;

  return <>{allowed ? children : fallback}</>;
};

export default Can;
