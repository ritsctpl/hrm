'use client';

import React from 'react';
import { useCan } from '../hooks/useCan';

export type CanAction = 'view' | 'add' | 'edit' | 'delete';

interface CanProps {
  I: CanAction;
  /** Override module code — defaults to the enclosing <ModuleAccessGate>. */
  on?: string;
  /** Rendered when the user LACKS the permission. Optional. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative permission gate for UI elements.
 *
 * Usage (inside a <ModuleAccessGate moduleCode="HRM_X"> subtree):
 *   <Can I="add"><Button>Add Foo</Button></Can>
 *   <Can I="edit" fallback={<Tag>Read-only</Tag>}><EditForm/></Can>
 *   <Can I="delete"><Popconfirm>...</Popconfirm></Can>
 *
 * For cross-module widgets, pass `on`:
 *   <Can I="add" on="HRM_ASSET">...</Can>
 */
const Can: React.FC<CanProps> = ({ I, on, fallback = null, children }) => {
  const perms = useCan(on);

  const allowed =
    I === 'view' ? perms.canView :
    I === 'add' ? perms.canAdd :
    I === 'edit' ? perms.canEdit :
    I === 'delete' ? perms.canDelete :
    false;

  return <>{allowed ? children : fallback}</>;
};

export default Can;
