import type { Role } from '../types/domain.types';
import {
  ROLE_CODE_REGEX,
  ROLE_CODE_MAX_LENGTH,
  ROLE_NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from './rbacConstants';

export function validateRole(draft: Partial<Role> | null): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft) {
    errors.general = 'No role data to validate.';
    return errors;
  }

  if (!draft.roleCode || draft.roleCode.trim() === '') {
    errors.roleCode = 'Role code is required.';
  } else if (!ROLE_CODE_REGEX.test(draft.roleCode.trim())) {
    errors.roleCode = 'Role code must contain only uppercase letters, digits, and underscores.';
  } else if (draft.roleCode.trim().length > ROLE_CODE_MAX_LENGTH) {
    errors.roleCode = `Role code must be at most ${ROLE_CODE_MAX_LENGTH} characters.`;
  }

  if (!draft.roleName || draft.roleName.trim() === '') {
    errors.roleName = 'Role name is required.';
  } else if (draft.roleName.trim().length > ROLE_NAME_MAX_LENGTH) {
    errors.roleName = `Role name must be at most ${ROLE_NAME_MAX_LENGTH} characters.`;
  }

  if (!draft.roleScope) {
    errors.roleScope = 'Scope is required.';
  }

  if (draft.description && draft.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  return errors;
}

export function validateAssignment(draft: Partial<{
  roleCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  assignmentNotes: string | null;
}> | null): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft) return errors;

  if (!draft.roleCode) {
    errors.roleCode = 'Role is required.';
  }

  if (!draft.effectiveFrom) {
    errors.effectiveFrom = 'Effective from date is required.';
  }

  if (
    draft.effectiveFrom &&
    draft.effectiveTo &&
    draft.effectiveTo < draft.effectiveFrom
  ) {
    errors.effectiveTo = 'Effective to must be after effective from.';
  }

  return errors;
}
