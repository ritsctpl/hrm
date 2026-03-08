"use client";

import React from "react";
import { Row, Col, Typography, Spin, Empty } from "antd";
import { PolicyDocument, PolicyCategory } from "../../types/domain.types";
import PolicyCard from "../molecules/PolicyCard";
import styles from "../../styles/PolicyLanding.module.css";

interface PolicyLibraryGridProps {
  policies: PolicyDocument[];
  categories: PolicyCategory[];
  loading: boolean;
  onPolicyClick: (policy: PolicyDocument) => void;
}

const PolicyLibraryGrid: React.FC<PolicyLibraryGridProps> = ({
  policies,
  categories,
  loading,
  onPolicyClick,
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

  const grouped = categories.reduce<Record<string, PolicyDocument[]>>((acc, cat) => {
    acc[cat.categoryName] = policies.filter((p) => p.categoryHandle === cat.handle);
    return acc;
  }, {});

  const uncategorized = policies.filter(
    (p) => !categories.some((c) => c.handle === p.categoryHandle)
  );

  return (
    <div className={styles.libraryGrid}>
      {Object.entries(grouped).map(([categoryName, categoryPolicies]) =>
        categoryPolicies.length === 0 ? null : (
          <div key={categoryName} className={styles.categorySection}>
            <Typography.Title level={5} className={styles.categoryTitle}>
              {categoryName} ({categoryPolicies.length})
            </Typography.Title>
            <Row gutter={[12, 12]}>
              {categoryPolicies.map((policy) => (
                <Col key={policy.handle} xs={24} sm={12} md={8} lg={6} xl={4}>
                  <PolicyCard policy={policy} onClick={onPolicyClick} />
                </Col>
              ))}
            </Row>
          </div>
        )
      )}
      {uncategorized.length > 0 && (
        <div className={styles.categorySection}>
          <Typography.Title level={5} className={styles.categoryTitle}>
            Other ({uncategorized.length})
          </Typography.Title>
          <Row gutter={[12, 12]}>
            {uncategorized.map((policy) => (
              <Col key={policy.handle} xs={24} sm={12} md={8} lg={6} xl={4}>
                <PolicyCard policy={policy} onClick={onPolicyClick} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default PolicyLibraryGrid;
