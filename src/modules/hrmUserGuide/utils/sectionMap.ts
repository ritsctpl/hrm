/**
 * User Guide module section → backend objectName mapping.
 *
 * `user_guide_module` is the ROOT object (module-level V/A/E/D); the library
 * object carries the per-record grants.
 */
export const hrmUserGuideSectionMap: Record<string, string> = {
  module: 'user_guide_module',
  library: 'user_guide_doc',
};
