import { parseCookies } from 'nookies';
import { message } from 'antd';

export function getSite(): string {
  const { site } = parseCookies();
  if (!site) {
    message.error('Session error: site not found. Please log in again.');
    throw new Error('Missing site cookie');
  }
  return site;
}
