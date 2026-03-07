'use client';

import { HolderOutlined } from '@ant-design/icons';
import styles from '../../styles/Dashboard.module.css';

export default function WidgetDragHandle() {
  return (
    <span className={`${styles.dragHandle} drag-handle`} title="Drag to reorder">
      <HolderOutlined />
    </span>
  );
}
