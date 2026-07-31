/** User Guide module — UI-only types. */

export type GuideTabKey = 'browse' | 'manage';

export type GuideViewMode = 'grid' | 'list';

/** Sentinel for the module rail's "All modules" entry. */
export const ALL_MODULES = '';

export interface GuideFormValues {
  moduleCode: string;
  title: string;
  description?: string;
  version?: string;
  audience: 'ALL' | 'ADMIN';
  displayOrder?: number;
  tags?: string[];
}
