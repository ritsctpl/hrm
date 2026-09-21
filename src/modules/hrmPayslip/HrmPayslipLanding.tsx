'use client';

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Tabs } from "antd";
import CommonAppBar from "@/components/CommonAppBar";
import SalaryRevealControl from "@/components/SalaryRevealControl";
import { getOrganizationId } from "@/utils/cookieUtils";
import { useHrmPayslipStore } from "./stores/payslipStore";
import ModuleAccessGate from "../hrmAccess/components/ModuleAccessGate";
import { useCan } from "../hrmAccess/hooks/useCan";
import { visiblePayslipTabs } from "./utils/payslipTabs";
import type { PayslipTabKey } from "./types/ui.types";
import styles from "./styles/Payslip.module.css";

const PayslipGenerationPanel = dynamic(
  () => import("./components/organisms/PayslipGenerationPanel"),
  { ssr: false }
);
const EmployeePayslipView = dynamic(
  () => import("./components/organisms/EmployeePayslipView"),
  { ssr: false }
);
const PayslipRepository = dynamic(
  () => import("./components/organisms/PayslipRepository"),
  { ssr: false }
);
const PayslipTabLayout = dynamic(
  () => import("./components/templates/PayslipTabLayout"),
  { ssr: false }
);

const PayslipUploadPanel = dynamic(
  () => import("./components/organisms/PayslipUploadPanel"),
  { ssr: false }
);
const UploadHistoryPanel = dynamic(
  () => import("./components/organisms/UploadHistoryPanel"),
  { ssr: false }
);

const TAB_LABELS: Record<PayslipTabKey, string> = {
  upload: "Upload",
  myPayslips: "My Payslips",
  repository: "Repository",
  uploadHistory: "Upload History",
  generate: "Generate",
  templates: "Templates",
};

function tabContent(key: PayslipTabKey): React.ReactNode {
  switch (key) {
    case "upload": return <PayslipUploadPanel />;
    case "myPayslips": return <EmployeePayslipView />;
    case "repository": return <PayslipRepository />;
    case "uploadHistory": return <UploadHistoryPanel />;
    case "generate": return <PayslipGenerationPanel />;
    case "templates": return <PayslipTabLayout />;
  }
}

const HrmPayslipLanding: React.FC = () => {
  const { activeTab, setActiveTab, loadMyPayslips, fetchTemplates } = useHrmPayslipStore();

  // This component renders ABOVE <ModuleAccessGate>, so there is no module context here: the module
  // code must be passed explicitly or useCan resolves nothing and denies everything (ruling R6).
  // The gates mirror the backend's PayslipPermission rules.
  const root = useCan("HRM_PAYSLIP", "payslip_module");
  const repository = useCan("HRM_PAYSLIP", "payslip_repository");
  const generation = useCan("HRM_PAYSLIP", "payslip_generate");
  const templates = useCan("HRM_PAYSLIP", "payslip_template");

  // Backend UPLOAD accepts payslip_repository|ADD or payslip_module|ADD. The FE maps object-level
  // canAdd to canEdit, so only the root grant gives exact parity (R6, option i).
  const canUpload = root.canAdd;
  // Backend VIEW_REPOSITORY is payslip_repository|VIEW with no root cascade.
  const canViewRepository = repository.canView;

  useEffect(() => {
    loadMyPayslips();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permissions load after first render (the section cache is filled once the gate mounts), so this
  // must re-run when the template grant arrives.
  useEffect(() => {
    if (templates.canView) {
      fetchTemplates();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.canView]);

  const visibleKeys = useMemo(
    () => visiblePayslipTabs({
      canUpload,
      canViewRepository,
      canViewGeneration: generation.canView,
      canViewTemplates: templates.canView,
    }),
    [canUpload, canViewRepository, generation.canView, templates.canView]
  );

  const tabItems = useMemo(
    () => visibleKeys.map((key) => ({ key, label: TAB_LABELS[key], children: tabContent(key) })),
    [visibleKeys]
  );

  // activeTab is controlled by the store (default "myPayslips", always visible). If it points at a
  // tab this user can't see, show My Payslips rather than an empty pane.
  const shownTab: PayslipTabKey = visibleKeys.includes(activeTab) ? activeTab : "myPayslips";

  return (
    <ModuleAccessGate moduleCode="HRM_PAYSLIP" appTitle="Payslip Management">
      <div className={`hrm-module-root ${styles.payslipPage}`}>
        <CommonAppBar appTitle="Payslip Management" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 16px 0' }}>
          <SalaryRevealControl organizationId={getOrganizationId()} />
        </div>
        <div className={styles.tabsWrapper}>
          <Tabs
            activeKey={shownTab}
            onChange={(key) => setActiveTab(key as PayslipTabKey)}
            items={tabItems}
            className={styles.mainTabs}
            size="small"
            tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
          />
        </div>
      </div>
    </ModuleAccessGate>
  );
};

export default HrmPayslipLanding;
