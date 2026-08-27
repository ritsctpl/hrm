'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'antd';
import CommonAppBar from '@/components/CommonAppBar';
import { getOrganizationId } from '@/utils/cookieUtils';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import { useCan } from '../hrmAccess/hooks/useCan';
import WorkforceTemplate from './components/templates/WorkforceTemplate';
import FleetTable from './components/organisms/FleetTable';
import AttendanceTable from './components/organisms/AttendanceTable';
import UtilizationPanel from './components/organisms/UtilizationPanel';
import FleetHealthPanel from './components/organisms/FleetHealthPanel';
import OfficeNetworksTable from './components/organisms/OfficeNetworksTable';
import { useHrmWorkforceData } from './hooks/useHrmWorkforceData';
import type { ReportSectionKey, WorkforceTabKey } from './types/ui.types';
import { MODULE_CODE, OBJ } from './utils/workforceConstants';

/**
 * The workforce screen: the machines, the attendance they derive, and the reports over both.
 *
 * <b>Tabs are built from grants, not rendered-then-hidden.</b> `workforce_fleet`, `attendance` and
 * `workforce_reports` are three separate objects on purpose — a line manager who may read
 * attendance has no business enumerating the estate's serial numbers — so each tab is *created*
 * only when its own VIEW grant is held. Rendering all three and disabling two would still ship the
 * data to the browser, and would leave a user whose access was revoked mid-session sitting on a tab
 * that no longer renders. If no tab survives, the gate's module-level grant was broader than any
 * object grant, and the screen says so rather than showing an empty frame.
 *
 * <b>Who loads what.</b> The two report panels are self-loading (each fires its own fetches
 * concurrently — see `FleetHealthPanel` for why sequencing them would erase the first failure), so
 * this landing deliberately does not drive them. `FleetTable` and `AttendanceTable` are not: they
 * are fed here, once, on the first activation of their tab. "Once" is the point — the tab panes are
 * kept mounted, so re-fetching on every switch would re-ask the server for a window the operator is
 * still reading, and would drop the filter results underneath them.
 *
 * <b>The Reports section toggle is owned here.</b> The Segmented itself lives in `ReportQueryBar`,
 * inside whichever panel is showing; the *value* has to outlive that panel's unmount or switching
 * to Fleet Health and back would land on Utilization again. Exactly one Segmented is ever rendered.
 */
const HrmWorkforceLanding: React.FC = () => {
  const fleetPerms = useCan(MODULE_CODE, OBJ.FLEET);
  const attendancePerms = useCan(MODULE_CODE, OBJ.ATTENDANCE);
  const reportPerms = useCan(MODULE_CODE, OBJ.REPORTS);

  const { refreshFleet, loadAttendance } = useHrmWorkforceData();

  // Every workforce request carries the site, and the backend answers a missing one with a 400.
  // Read once per render rather than per call so the notice and the calls agree about what is set.
  const site = getOrganizationId();

  const [section, setSection] = useState<ReportSectionKey>('utilization');

  const tabItems = useMemo(
    () => [
      ...(fleetPerms.canView
        ? [{ key: 'fleet' as const, label: 'Fleet', children: <FleetTable /> }]
        : []),
      ...(attendancePerms.canView
        ? [{ key: 'attendance' as const, label: 'Attendance', children: <AttendanceTable /> }]
        : []),
      ...(reportPerms.canView
        ? [
            {
              key: 'reports' as const,
              label: 'Reports',
              children:
                section === 'utilization' ? (
                  <UtilizationPanel section={section} onSectionChange={setSection} />
                ) : (
                  <FleetHealthPanel section={section} onSectionChange={setSection} />
                ),
            },
          ]
        : []),
      ...(fleetPerms.canView
        ? [{ key: 'networks' as const, label: 'Office Networks', children: <OfficeNetworksTable /> }]
        : []),
    ],
    [fleetPerms.canView, attendancePerms.canView, reportPerms.canView, section],
  );

  const visibleKeys = useMemo(() => tabItems.map((t) => t.key), [tabItems]);
  const [activeTab, setActiveTab] = useState<WorkforceTabKey>('fleet');
  // A grant that arrives late (or is revoked mid-session) can leave the chosen tab non-existent;
  // falling back to the first tab that does exist keeps the screen showing something real.
  const activeKey = visibleKeys.includes(activeTab) ? activeTab : visibleKeys[0];

  // First activation of a tab fetches it — and only the first. The panes stay mounted, so a
  // re-fetch per switch would re-ask the server for a window the operator is still reading. Each
  // tab's own Refresh button is how a stale view is re-asked for, deliberately by hand.
  const loaded = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!activeKey || !site) return;
    if (loaded.current.has(activeKey)) return;
    loaded.current.add(activeKey);
    if (activeKey === 'fleet') void refreshFleet();
    if (activeKey === 'attendance') void loadAttendance();
    // The loaders are stable per site/actor; depending on them would re-run this on every render
    // that produced a new callback identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, site]);

  const notice = !site ? (
    <Alert
      type="warning"
      showIcon
      message="No site selected"
      description="Every workforce request is scoped to a site, and the server rejects one without it. Pick a site in the bar above to load the fleet, attendance and reports."
    />
  ) : visibleKeys.length === 0 ? (
    <Alert
      type="info"
      showIcon
      message="No workforce sections are granted to you"
      description="You can open this module, but Fleet, Attendance and Reports each need their own view grant. Ask an administrator for the section you need."
    />
  ) : undefined;

  return (
    <ModuleAccessGate moduleCode={MODULE_CODE} appTitle="Workforce">
      <WorkforceTemplate
        appBar={<CommonAppBar appTitle="Workforce" />}
        notice={notice}
        items={tabItems}
        activeKey={activeKey}
        onChange={(key) => setActiveTab(key as WorkforceTabKey)}
      />
    </ModuleAccessGate>
  );
};

export default HrmWorkforceLanding;
