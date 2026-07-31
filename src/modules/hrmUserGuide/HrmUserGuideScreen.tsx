'use client';

import React from 'react';
import { Modal } from 'antd';
import GuidePdfViewer from './components/organisms/GuidePdfViewer';
import { useHrmUserGuideStore } from './stores/hrmUserGuideStore';
import styles from './styles/UserGuide.module.css';

/**
 * Guide viewer. Presented as a near-full-screen modal rather than a routed
 * page so the reader keeps their place in the library underneath — they
 * typically open two or three guides in a row.
 */
const HrmUserGuideScreen: React.FC = () => {
  const showViewer = useHrmUserGuideStore((s) => s.showViewer);
  const selectedGuide = useHrmUserGuideStore((s) => s.selectedGuide);
  const selectedGuideLoading = useHrmUserGuideStore((s) => s.selectedGuideLoading);
  const closeViewer = useHrmUserGuideStore((s) => s.closeViewer);

  return (
    <Modal
      open={showViewer}
      onCancel={closeViewer}
      footer={null}
      width="90vw"
      style={{ top: 24, maxWidth: 1200 }}
      styles={{ body: { padding: 0, height: '82vh' } }}
      destroyOnHidden
      className={styles.viewerModal}
    >
      <GuidePdfViewer guide={selectedGuide} loading={selectedGuideLoading} />
    </Modal>
  );
};

export default HrmUserGuideScreen;
