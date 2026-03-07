// src/utils/cookieUtils.ts
import { parseCookies } from 'nookies';

export const getDataFromCookies = () => {
  const cookies = parseCookies();
  const activities = cookies.activities ? JSON.parse(cookies.activities) : [];
  const site = cookies.site || null;

  return { activities, site };
};
