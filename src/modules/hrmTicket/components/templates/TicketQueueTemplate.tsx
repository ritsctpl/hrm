'use client';

import React from 'react';

interface Props {
  filterBar: React.ReactNode;
  summary?: React.ReactNode;
  table: React.ReactNode;
}

/**
 * Filters on top, counts under them, table filling the rest.
 *
 * The table owns the scroll rather than the page, so the filter bar and the status chips stay put
 * while a long queue is scanned — on a 200-row queue, filters that scroll away mean scrolling back
 * to the top to change anything.
 */
const TicketQueueTemplate: React.FC<Props> = ({ filterBar, summary, table }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      background: '#fff',
    }}
  >
    {filterBar}
    {summary}
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{table}</div>
  </div>
);

export default TicketQueueTemplate;
