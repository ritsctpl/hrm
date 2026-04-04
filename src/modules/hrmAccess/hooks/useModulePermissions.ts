import { useHrmRbacStore } from '../stores/hrmRbacStore';

interface ModulePermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function useModulePermissions(moduleCode: string): ModulePermissions {
  const getModuleActions = useHrmRbacStore(s => s.getModuleActions);
  const isReady = useHrmRbacStore(s => s.isReady);

  if (!isReady || !moduleCode) {
    return { canView: false, canAdd: false, canEdit: false, canDelete: false };
  }

  const actions = getModuleActions(moduleCode);
  return {
    canView: actions.includes('VIEW'),
    canAdd: actions.includes('ADD'),
    canEdit: actions.includes('EDIT'),
    canDelete: actions.includes('DELETE'),
  };
}
