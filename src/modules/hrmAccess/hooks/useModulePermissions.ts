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

  const actions = isReady && moduleCode ? getModuleActions(moduleCode) : [];
  return {
    canView: actions.includes('VIEW'),
    canAdd: actions.includes('ADD'),
    canEdit: actions.includes('EDIT'),
    canDelete: actions.includes('DELETE'),
  };
}
