"use client";

import React from "react";
import { Spin, Empty } from "antd";
import { PolicyDocument } from "../../types/domain.types";
import PolicyListRow from "../molecules/PolicyListRow";
import styles from "../../styles/PolicyLanding.module.css";

interface PolicyLibraryListProps {
  policies: PolicyDocument[];
  loading: boolean;
  onPolicyClick: (policy: PolicyDocument) => void;
  onEdit?: (policy: PolicyDocument) => void;
}

const PolicyLibraryList: React.FC<PolicyLibraryListProps> = ({
  policies,
  loading,
  onPolicyClick,
  onEdit,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <Spin size="large" />
      </div>
    );
  }
  if (policies.length === 0) {
    return <Empty description="No policies found" style={{ marginTop: 40 }} />;
  }
  return (
    <>
      {policies.map((policy) => (
        <PolicyListRow
          key={policy.handle}
          policy={policy}
          onClick={onPolicyClick}
          onEdit={onEdit}
        />
      ))}
    </>
  );
};

export default PolicyLibraryList;
