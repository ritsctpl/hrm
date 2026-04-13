'use client';

import { useMemo } from 'react';
import { parseCookies } from 'nookies';

/**
 * Returns true when the target identifier matches the currently signed-in
 * user. Used to combine RBAC checks with self-service rules — e.g. an
 * employee can edit their OWN contact details even without the global
 * `employee_contact EDIT` permission.
 *
 * The check tolerates multiple identifier shapes because different parts
 * of the codebase store the user identity under different cookie keys
 * (`userId`, `rl_user_id`, `username`) and different domain objects use
 * different fields (workEmail, employeeCode, handle, employeeId).
 *
 * Pass any/all of the candidate identifiers from the resource being
 * viewed; if ANY of them matches ANY of the cookie identifiers, it's the
 * same user.
 */
export function useIsSelf(...candidates: Array<string | null | undefined>): boolean {
  return useMemo(() => {
    const cookies = parseCookies();
    const userIds = [
      cookies.userId,
      cookies.rl_user_id,
      cookies.username,
    ].filter(Boolean).map(s => s.toLowerCase());

    if (userIds.length === 0) return false;

    return candidates.some(c => {
      if (!c) return false;
      return userIds.includes(String(c).toLowerCase());
    });
    // parseCookies is a sync read — re-evaluating per candidate change is enough.
  }, [candidates.join('|')]);
}
