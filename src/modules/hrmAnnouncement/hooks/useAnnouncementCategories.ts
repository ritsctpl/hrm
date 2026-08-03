'use client';

import { useEffect, useState } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmAnnouncementService } from '../services/hrmAnnouncementService';
import type { AnnouncementCategoryRecord } from '../types/api.types';

/**
 * Categories are per-site Mongo records, so every consumer — composer picker,
 * list badges, filters — must read them from the server.
 *
 * Cached per site at module level: badges render once per row, and each of
 * them fetching independently would be dozens of duplicate calls. The endpoint
 * self-seeds, needs no permission, and is safe to call before identity
 * resolves, so there is nothing to gate on.
 */
const cache = new Map<string, Promise<AnnouncementCategoryRecord[]>>();

export function loadCategories(organizationId: string): Promise<AnnouncementCategoryRecord[]> {
  if (!cache.has(organizationId)) {
    cache.set(
      organizationId,
      HrmAnnouncementService.listCategories(organizationId).catch(() => {
        // Don't poison the cache — a transient failure should be retryable.
        cache.delete(organizationId);
        return [];
      })
    );
  }
  return cache.get(organizationId)!;
}

/** Drops the cache so a newly created category shows up without a reload. */
export function invalidateCategories(organizationId?: string) {
  if (organizationId) cache.delete(organizationId);
  else cache.clear();
}

export function useAnnouncementCategories() {
  const organizationId = getOrganizationId();
  const [categories, setCategories] = useState<AnnouncementCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    let alive = true;
    loadCategories(organizationId)
      .then((list) => alive && setCategories(list))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [organizationId]);

  const byCode = (code?: string) => categories.find((c) => c.categoryCode === code);

  return {
    categories,
    loading,
    byCode,
    /** Sorted for pickers; displayOrder is the server's intended ordering. */
    sorted: categories.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
  };
}
