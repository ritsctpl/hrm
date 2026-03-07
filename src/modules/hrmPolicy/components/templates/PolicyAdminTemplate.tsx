"use client";

import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PolicyDocument, PolicyCategory } from "../../types/domain.types";
import PolicyAdminTable from "../organisms/PolicyAdminTable";
import PolicyFormDrawer from "../organisms/PolicyFormDrawer";
import styles from "../../styles/PolicyAdmin.module.css";

interface PolicyAdminTemplateProps {
  policies: PolicyDocument[];
  categories: PolicyCategory[];
  loading: boolean;
  showFormDrawer: boolean;
  editPolicy: PolicyDocument | null;
  site: string;
  onEdit: (policy: PolicyDocument) => void;
  onPublish: (policyId: string) => void;
  onArchive: (policyId: string) => void;
  onViewDetail: (policy: PolicyDocument) => void;
  onCreateNew: () => void;
  onDrawerClose: () => void;
  onDrawerSaved: () => void;
}

const PolicyAdminTemplate: React.FC<PolicyAdminTemplateProps> = ({
  policies,
  categories,
  loading,
  showFormDrawer,
  editPolicy,
  site,
  onEdit,
  onPublish,
  onArchive,
  onViewDetail,
  onCreateNew,
  onDrawerClose,
  onDrawerSaved,
}) => (
  <div className={styles.adminTemplate}>
    <div className={styles.adminToolbar}>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreateNew}>
        New Policy
      </Button>
    </div>
    <PolicyAdminTable
      policies={policies}
      loading={loading}
      onEdit={onEdit}
      onPublish={onPublish}
      onArchive={onArchive}
      onViewDetail={onViewDetail}
    />
    <PolicyFormDrawer
      open={showFormDrawer}
      editPolicy={editPolicy}
      categories={categories}
      site={site}
      onClose={onDrawerClose}
      onSaved={onDrawerSaved}
    />
  </div>
);

export default PolicyAdminTemplate;
