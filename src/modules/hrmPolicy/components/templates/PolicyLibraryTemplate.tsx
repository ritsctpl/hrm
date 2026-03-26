"use client";

import React from "react";
import { Space, Select, Input, Button, Segmented } from "antd";
import { AppstoreOutlined, BarsOutlined, PlusOutlined } from "@ant-design/icons";
import { PolicyDocument, PolicyCategory } from "../../types/domain.types";
import PolicyLibraryGrid from "../organisms/PolicyLibraryGrid";
import PolicyLibraryList from "../organisms/PolicyLibraryList";
import styles from "../../styles/PolicyLanding.module.css";

const { Option } = Select;

interface PolicyLibraryTemplateProps {
  policies: PolicyDocument[];
  categories: PolicyCategory[];
  loading: boolean;
  viewMode: "grid" | "list";
  filterCategoryId: string;
  filterDocType: string;
  filterStatus: string;
  searchText: string;
  canAdmin: boolean;
  onPolicyClick: (policy: PolicyDocument) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  onSearch: (text: string) => void;
  onCategoryFilter: (id: string) => void;
  onDocTypeFilter: (type: string) => void;
  onStatusFilter: (status: string) => void;
  onCreatePolicy: () => void;
}

const PolicyLibraryTemplate: React.FC<PolicyLibraryTemplateProps> = ({
  policies,
  categories,
  loading,
  viewMode,
  filterCategoryId,
  filterDocType,
  filterStatus,
  searchText,
  canAdmin,
  onPolicyClick,
  onViewModeChange,
  onSearch,
  onCategoryFilter,
  onDocTypeFilter,
  onStatusFilter,
  onCreatePolicy,
}) => {
  // Client-side filtering by search text
  const filteredPolicies = React.useMemo(() => {
    if (!searchText || searchText.trim() === '') {
      return policies;
    }
    
    const searchLower = searchText.toLowerCase().trim();
    return policies.filter(policy => 
      policy.title?.toLowerCase().includes(searchLower) ||
      policy.description?.toLowerCase().includes(searchLower) ||
      policy.policyCode?.toLowerCase().includes(searchLower)
    );
  }, [policies, searchText]);

  return (
    <div className={styles.libraryTemplate}>
    <div className={styles.toolbar}>
      <Space wrap>
        <Input.Search
          placeholder="Search policies..."
          aria-label="Search policies by title, code, or description"
          value={searchText}
          onChange={(e) => onSearch(e.target.value)}
          onSearch={(value) => onSearch(value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder="Category"
          aria-label="Filter by policy category"
          value={filterCategoryId || undefined}
          allowClear
          onChange={(v) => onCategoryFilter(v || "")}
          style={{ width: 160 }}
        >
          {categories.map((cat) => (
            <Option key={cat.handle} value={cat.handle}>{cat.categoryName}</Option>
          ))}
        </Select>
        <Select
          placeholder="Type"
          aria-label="Filter by document type"
          value={filterDocType || undefined}
          allowClear
          onChange={(v) => onDocTypeFilter(v || "")}
          style={{ width: 130 }}
        >
          <Option value="POLICY">Policy</Option>
          <Option value="SOP">SOP</Option>
          <Option value="REGULATION">Regulation</Option>
          <Option value="GUIDELINE">Guideline</Option>
          <Option value="CODE_OF_CONDUCT">Code of Conduct</Option>
        </Select>
        <Select
          placeholder="Status"
          aria-label="Filter by policy status"
          value={filterStatus || undefined}
          allowClear
          onChange={(v) => onStatusFilter(v || "")}
          style={{ width: 130 }}
        >
          <Option value="PUBLISHED">Published</Option>
          <Option value="DRAFT">Draft</Option>
          <Option value="REVIEW">Under Review</Option>
          <Option value="APPROVED">Approved</Option>
          <Option value="RETIRED">Retired</Option>
          <Option value="SUPERSEDED">Superseded</Option>
        </Select>
      </Space>
      <Space>
        <Segmented
          aria-label="Toggle between grid and list view"
          value={viewMode}
          onChange={(v) => onViewModeChange(v as "grid" | "list")}
          options={[
            { value: "grid", icon: <AppstoreOutlined />, label: "Grid view" },
            { value: "list", icon: <BarsOutlined />, label: "List view" },
          ]}
        />
        {canAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreatePolicy}>
            New Policy
          </Button>
        )}
      </Space>
    </div>
    <div className={viewMode === "grid" ? styles.libraryGrid : styles.libraryList}>
      {viewMode === "grid" ? (
        <PolicyLibraryGrid
          policies={filteredPolicies}
          categories={categories}
          loading={loading}
          filterCategoryId={filterCategoryId}
          onPolicyClick={onPolicyClick}
        />
      ) : (
        <PolicyLibraryList
          policies={filteredPolicies}
          loading={loading}
          onPolicyClick={onPolicyClick}
        />
      )}
    </div>
  </div>
  );
};

export default PolicyLibraryTemplate;
