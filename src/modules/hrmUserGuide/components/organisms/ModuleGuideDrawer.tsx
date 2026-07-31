'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Drawer, Empty, Spin, message } from 'antd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmUserGuideService } from '../../services/hrmUserGuideService';
import GuideCard from '../molecules/GuideCard';
import GuidePdfViewer from './GuidePdfViewer';
import type { UserGuide } from '../../types/domain.types';
import { base64ToBlob, downloadBlob } from '../../utils/guideHelpers';
import { moduleLabel } from '../../utils/guideConstants';

interface ModuleGuideDrawerProps {
  /** The module whose guides to show, e.g. "HRM_LEAVE". */
  moduleCode: string;
  open: boolean;
  onClose: () => void;
}

/**
 * In-context help. Drop this behind a `?` button in any module:
 *
 *   <ModuleGuideDrawer moduleCode="HRM_LEAVE" open={helpOpen} onClose={...} />
 *
 * It deliberately keeps its own local state instead of the shared store — it
 * can be mounted inside any module, and writing to the library store from
 * there would clobber the Guides screen's list and filters.
 */
const ModuleGuideDrawer: React.FC<ModuleGuideDrawerProps> = ({ moduleCode, open, onClose }) => {
  const organizationId = getOrganizationId();
  const [guides, setGuides] = useState<UserGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserGuide | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await HrmUserGuideService.listGuides({
        organizationId,
        moduleCode,
        status: 'PUBLISHED',
      });
      setGuides(list);
    } catch {
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, moduleCode]);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    load();
  }, [open, load]);

  const handleOpen = async (guide: UserGuide) => {
    setSelected(guide);
    setSelectedLoading(true);
    try {
      const full = await HrmUserGuideService.getGuide({ organizationId, guideId: guide.guideId });
      setSelected(full);
    } catch {
      message.error('Failed to open the guide');
    } finally {
      setSelectedLoading(false);
    }
  };

  const handleDownload = async (guide: UserGuide) => {
    setDownloadingId(guide.guideId);
    try {
      const full = guide.contentBase64
        ? guide
        : await HrmUserGuideService.getGuide({ organizationId, guideId: guide.guideId });
      if (!full?.contentBase64) {
        message.warning('No file attached to this guide');
        return;
      }
      downloadBlob(
        base64ToBlob(full.contentBase64, full.fileType || 'application/pdf'),
        full.fileName || `${full.title}.pdf`,
      );
    } catch {
      message.error('Failed to download the guide');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Drawer
      title={selected ? selected.title : `${moduleLabel(moduleCode)} — User Guides`}
      open={open}
      onClose={onClose}
      width={selected ? 900 : 560}
      destroyOnHidden
      styles={{ body: { padding: selected ? 0 : 16, display: 'flex', flexDirection: 'column' } }}
      extra={
        selected ? (
          <Button
            size="small"
            icon={<ArrowBackIcon style={{ fontSize: 16 }} />}
            onClick={() => setSelected(null)}
          >
            All guides
          </Button>
        ) : null
      }
    >
      {selected ? (
        <GuidePdfViewer guide={selected} loading={selectedLoading} />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : guides.length === 0 ? (
        <Empty description="No guides published for this module yet" style={{ marginTop: 40 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guides.map((g) => (
            <GuideCard
              key={g.guideId}
              guide={g}
              onOpen={handleOpen}
              onDownload={handleDownload}
              downloading={downloadingId === g.guideId}
            />
          ))}
        </div>
      )}
    </Drawer>
  );
};

export default ModuleGuideDrawer;
