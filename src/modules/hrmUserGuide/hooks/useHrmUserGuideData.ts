'use client';

import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmUserGuideService } from '../services/hrmUserGuideService';
import { useHrmUserGuideStore } from '../stores/hrmUserGuideStore';
import type { UserGuide } from '../types/domain.types';
import type { CreateGuidePayload, UpdateGuidePayload } from '../types/api.types';

/** Signed-in user, for the audit fields the backend requires on writes. */
export function useCurrentActor(): string {
  const { userId, rl_user_id, userEmail } = parseCookies();
  return userId || rl_user_id || userEmail || 'system';
}

/**
 * Wraps the store with the service calls + user feedback, so components stay
 * presentational. Every loader is safe to call unconditionally — callers gate
 * on RBAC before invoking the admin ones.
 */
export function useHrmUserGuideData() {
  const store = useHrmUserGuideStore();
  const organizationId = getOrganizationId();
  const actor = useCurrentActor();

  /** Left-rail module list + counts. */
  const loadModuleCounts = useCallback(
    async (includeUnpublished = false) => {
      const { setModuleCounts, setModuleCountsLoading } = useHrmUserGuideStore.getState();
      setModuleCountsLoading(true);
      try {
        const counts = await HrmUserGuideService.listModulesWithGuides({
          organizationId,
          includeUnpublished,
        });
        setModuleCounts(counts);
      } catch {
        // A failed rail is not worth a toast — the grid below still loads and
        // carries its own error state.
        setModuleCounts([]);
      } finally {
        setModuleCountsLoading(false);
      }
    },
    [organizationId],
  );

  /** Published library for the Guides tab. */
  const loadGuides = useCallback(
    async (moduleCode?: string) => {
      const { setGuides, setGuidesLoading } = useHrmUserGuideStore.getState();
      setGuidesLoading(true);
      try {
        const guides = await HrmUserGuideService.listGuides({
          organizationId,
          status: 'PUBLISHED',
          ...(moduleCode ? { moduleCode } : {}),
        });
        setGuides(guides);
      } catch {
        message.error('Failed to load user guides');
        setGuides([]);
      } finally {
        setGuidesLoading(false);
      }
    },
    [organizationId],
  );

  /** Everything including DRAFT / ARCHIVED, for the Manage tab. */
  const loadAdminGuides = useCallback(async () => {
    const { setAdminGuides, setAdminGuidesLoading, adminFilterModuleCode, adminFilterStatus } =
      useHrmUserGuideStore.getState();
    setAdminGuidesLoading(true);
    try {
      const guides = await HrmUserGuideService.listGuides({
        organizationId,
        ...(adminFilterModuleCode ? { moduleCode: adminFilterModuleCode } : {}),
        ...(adminFilterStatus ? { status: adminFilterStatus as UserGuide['status'] } : {}),
      });
      setAdminGuides(guides);
    } catch {
      message.error('Failed to load guides');
      setAdminGuides([]);
    } finally {
      setAdminGuidesLoading(false);
    }
  }, [organizationId]);

  /**
   * Open a guide in the viewer. The list record is shown at once (title,
   * version) and swapped for the full record once the PDF bytes arrive.
   */
  const openGuide = useCallback(
    async (guide: UserGuide) => {
      const { openViewer, setSelectedGuide, setSelectedGuideLoading } =
        useHrmUserGuideStore.getState();
      openViewer(guide);
      try {
        const full = await HrmUserGuideService.getGuide({
          organizationId,
          guideId: guide.guideId,
        });
        setSelectedGuide(full);
      } catch {
        message.error('Failed to open the guide');
      } finally {
        setSelectedGuideLoading(false);
      }
    },
    [organizationId],
  );

  /** Fetches the document bytes without opening the viewer (download action). */
  const fetchGuideContent = useCallback(
    async (guideId: string): Promise<UserGuide | null> => {
      try {
        return await HrmUserGuideService.getGuide({ organizationId, guideId });
      } catch {
        message.error('Failed to download the guide');
        return null;
      }
    },
    [organizationId],
  );

  const createGuide = useCallback(
    async (
      values: Omit<
        CreateGuidePayload,
        'organizationId' | 'uploadedBy' | 'fileName' | 'fileType' | 'fileSizeBytes' | 'contentBase64'
      >,
      file: File,
    ): Promise<boolean> => {
      const { setSaving } = useHrmUserGuideStore.getState();
      setSaving(true);
      try {
        await HrmUserGuideService.createGuide(
          { ...values, organizationId, uploadedBy: actor },
          file,
        );
        message.success('Guide uploaded');
        return true;
      } catch {
        message.error('Failed to upload the guide');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [organizationId, actor],
  );

  const updateGuide = useCallback(
    async (
      values: Omit<UpdateGuidePayload, 'organizationId' | 'modifiedBy'>,
      file?: File,
    ): Promise<boolean> => {
      const { setSaving } = useHrmUserGuideStore.getState();
      setSaving(true);
      try {
        await HrmUserGuideService.updateGuide(
          { ...values, organizationId, modifiedBy: actor },
          file,
        );
        message.success('Guide updated');
        return true;
      } catch {
        message.error('Failed to update the guide');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [organizationId, actor],
  );

  const publishGuide = useCallback(
    async (guideId: string): Promise<boolean> => {
      try {
        await HrmUserGuideService.publishGuide({ organizationId, guideId, publishedBy: actor });
        message.success('Guide published');
        return true;
      } catch {
        message.error('Failed to publish the guide');
        return false;
      }
    },
    [organizationId, actor],
  );

  const deleteGuide = useCallback(
    async (guideId: string): Promise<boolean> => {
      const { setDeleting } = useHrmUserGuideStore.getState();
      setDeleting(true);
      try {
        await HrmUserGuideService.deleteGuide({ organizationId, guideId, deletedBy: actor });
        message.success('Guide archived');
        return true;
      } catch {
        message.error('Failed to archive the guide');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [organizationId, actor],
  );

  return {
    store,
    organizationId,
    actor,
    loadModuleCounts,
    loadGuides,
    loadAdminGuides,
    openGuide,
    fetchGuideContent,
    createGuide,
    updateGuide,
    publishGuide,
    deleteGuide,
  };
}
