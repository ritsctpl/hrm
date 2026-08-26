'use client';

import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import styles from '../../styles/Workforce.module.css';

interface Props {
  /** The module's app bar — passed in rather than rendered here so the landing owns the title. */
  appBar: React.ReactNode;
  /** Rendered between the app bar and the tab strip; used for the missing-site warning. */
  notice?: React.ReactNode;
  items: TabsProps['items'];
  activeKey?: string;
  onChange: (key: string) => void;
  /** Rendered at the right end of the tab strip. */
  tabBarExtraContent?: React.ReactNode;
}

/**
 * The workforce screen's frame: app bar, an optional page-wide notice, and the tab strip.
 *
 * <b>The page does not scroll; the tables do.</b> The root is a fixed-height column and every tab's
 * table already carries its own `scroll.y`, so the app bar, the tab strip and each tab's filter bar
 * stay put while a few hundred fleet rows are scanned. A page that scrolls as well as its tables is
 * a page whose filters walk off the top exactly when they are needed.
 *
 * <b>Hidden tabs are kept mounted</b> (`destroyOnHidden={false}`). Each tab owns query state the
 * user chose — a date range, a search box, a liveness filter — and destroying the pane would throw
 * it away on every switch, so coming back to Attendance would silently reset the window under a
 * table that had been reasoned about. It also means a tab is fetched once rather than on each
 * visit.
 *
 * Presentational on purpose: no store, no hook, no grants. Which tabs exist is a question about
 * access, and it is answered one level up in `HrmWorkforceLanding`.
 */
const WorkforceTemplate: React.FC<Props> = ({
  appBar,
  notice,
  items,
  activeKey,
  onChange,
  tabBarExtraContent,
}) => (
  <div className={`hrm-module-root ${styles.wfRoot}`}>
    {appBar}
    {notice ? <div className={styles.wfNotice}>{notice}</div> : null}
    <div className={styles.wfContent}>
      <Tabs
        activeKey={activeKey}
        onChange={onChange}
        items={items}
        size="small"
        tabBarExtraContent={tabBarExtraContent}
        className={styles.wfTabs}
        // The tab strip's padding and its rule are a class (`.wfTabs :global(.ant-tabs-nav)`)
        // rather than an inline style, so the border colour is a token dark mode re-declares.
        tabBarGutter={16}
        destroyOnHidden={false}
      />
    </div>
  </div>
);

export default WorkforceTemplate;
