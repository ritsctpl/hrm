// src/utils/cookieUtils.ts
import { parseCookies } from 'nookies';

/**
 * Single source of truth for reading the organizationId from cookies.
 * The cookie key remains `site` (set by auth), but all consuming code
 * should treat the value as `organizationId`.
 */
export function getOrganizationId(): string {
  return parseCookies().site ?? '';
}

export const getDataFromCookies = () => {
  const cookies = parseCookies();
  const activities = cookies.activities ? JSON.parse(cookies.activities) : [];
  const organizationId = cookies.site || null;

  return { activities, organizationId };
};
