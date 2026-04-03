'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { BREADCRUMB_GROUP_MAP } from '@/config/dashboardConfig';

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  if (pathname === '/' || pathname === '') return null;

  const segments = pathname.split('/').filter(Boolean);
  const appKey = segments[segments.length - 1];
  const groupName = BREADCRUMB_GROUP_MAP[appKey];

  if (!groupName) return null;

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', fontSize: 13, color: 'var(--hrm-text-tertiary, #94a3b8)' }}>
      <span
        style={{ cursor: 'pointer', color: 'var(--hrm-accent, #6366f1)' }}
        onClick={() => router.push('/')}
      >
        {t('nav.breadcrumb.home')}
      </span>
      <ChevronRight size={14} />
      <span>{groupName}</span>
      <ChevronRight size={14} />
      <span style={{ color: 'var(--hrm-text-primary, #0f172a)', fontWeight: 500 }}>
        {appKey.replace(/_/g, ' ').replace(/hrm |app/g, '').trim()}
      </span>
    </nav>
  );
};

export default Breadcrumbs;
