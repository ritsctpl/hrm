'use client';

import React from 'react';
import styles from '../../styles/UserGuide.module.css';

interface GuideLibraryTemplateProps {
  /** Module rail. */
  leftPanel: React.ReactNode;
  /** Toolbar + grid. */
  rightPanel: React.ReactNode;
}

/** Fixed-width rail on the left, scrollable library on the right. */
const GuideLibraryTemplate: React.FC<GuideLibraryTemplateProps> = ({ leftPanel, rightPanel }) => (
  <div className={styles.libraryLayout}>
    <aside className={styles.libraryRail}>{leftPanel}</aside>
    <section className={styles.libraryMain}>{rightPanel}</section>
  </div>
);

export default GuideLibraryTemplate;
