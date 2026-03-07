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
    return <Empty description="No policies found" />;
  }
  return (
    <div className={styles.libraryList}>
      {policies.map((policy) => (
        <PolicyListRow
          key={policy.id}
          policy={policy}
          onClick={onPolicyClick}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default PolicyLibraryList;
