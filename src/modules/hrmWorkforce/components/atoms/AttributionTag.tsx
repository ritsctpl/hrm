'use client';

import React from 'react';
import { Tag, Tooltip } from 'antd';
import styles from '../../styles/Workforce.module.css';

interface Props {
  /** Present only where the caller has joined the employee list — the fleet row has no name. */
  employeeName?: string | null;
  /** `attributedEmployeeId` off the fleet row: the id is all the backend returns. */
  employeeCode?: string | null;
}

/**
 * Who a machine's activity lands on — or, louder, that it lands on nobody.
 *
 * `/workforce/fleet/list` returns `attributedEmployeeId` and no name (controller ruling), so the
 * id is the normal thing to render here and a name only appears when a caller has joined the
 * employee list itself. Both are handled rather than assuming one: a screen that showed a blank
 * because it was waiting for a name it will never receive would look like an empty column.
 *
 * The null case is the point of the component. An unattributed device is a machine whose hours
 * will never reach anybody's attendance — the asset register has drifted from the device
 * registry — and that is a gap to close, so it renders as an amber "Unattributed" rather than
 * an em dash that scans as "nothing here".
 */
const AttributionTag: React.FC<Props> = ({ employeeName, employeeCode }) => {
  const label = employeeName?.trim() || employeeCode?.trim();

  if (!label) {
    return (
      <Tooltip title="No employee holds this device, so its activity reaches no attendance record — check the asset register.">
        <Tag color="warning" className={styles.unattributed}>
          Unattributed
        </Tag>
      </Tooltip>
    );
  }

  // Both known: the name is what a human reads, the id is what they search the register by.
  const title = employeeName?.trim() && employeeCode?.trim() ? employeeCode.trim() : undefined;
  const tag = (
    <Tag className={styles.attributionTag}>
      {label}
    </Tag>
  );
  return title ? <Tooltip title={title}>{tag}</Tooltip> : tag;
};

export default AttributionTag;
