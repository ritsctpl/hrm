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
  filterCategoryId?: string;
  onPolicyClick: (policy: PolicyDocument) => void;
}

const PolicyLibraryGrid: React.FC<PolicyLibraryGridProps> = ({
  policies,
  categories,
  loading,
  filterCategoryId,
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
    return <Empty description="No policies found" style={{ marginTop: 40 }} />;
  }

  // If a category filter is active, don't group - just show all policies
  if (filterCategoryId) {
    const filteredCategory = categories.find(c => c.handle === filterCategoryId);
    const categoryName = filteredCategory?.categoryName || "Filtered Policies";
    
    return (
      <div className={styles.categorySection}>
        <Typography.Title level={5} className={styles.categoryTitle}>
          {categoryName} ({policies.length})
        </Typography.Title>
        <Row gutter={[12, 12]}>
          {policies.map((policy) => (
            <Col key={policy.handle} xs={24} sm={12} md={8} lg={6} xl={4}>
              <PolicyCard policy={policy} onClick={onPolicyClick} />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  // Normal grouping logic when no filter is active
  // Group by actual category names in the policies, not by the categories array
  const grouped: Record<string, PolicyDocument[]> = {};
  const uncategorized: PolicyDocument[] = [];
  
  policies.forEach((policy) => {
    if (policy.categoryName) {
      if (!grouped[policy.categoryName]) {
        grouped[policy.categoryName] = [];
      }
      grouped[policy.categoryName].push(policy);
    } else {
      uncategorized.push(policy);
    }
  });

  console.log('PolicyLibraryGrid - Total policies:', policies.length);
  console.log('PolicyLibraryGrid - Grouped by categoryName:', Object.entries(grouped).map(([cat, pols]) => ({ category: cat, count: pols.length })));
  console.log('PolicyLibraryGrid - Uncategorized count:', uncategorized.length);

  return (
    <>
      {Object.entries(grouped).map(([categoryName, categoryPolicies]) => (
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
      ))}
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
    </>
  );
};

export default PolicyLibraryGrid;
