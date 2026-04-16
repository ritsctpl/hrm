"use client";

import React from "react";
import { Space, Select, Input, Button, Segmented } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PolicyDocument, PolicyCategory } from "../../types/domain.types";
import PolicyLibraryList from "../organisms/PolicyLibraryList";
import PolicyLibraryGrid from "../organisms/PolicyLibraryGrid";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/PolicyLanding.module.css";

const { Option } = Select;

interface PolicyLibraryTemplateProps {
  policies: PolicyDocument[];
  categories: PolicyCategory[];
  loading: boolean;
  viewMode: "grid" | "list";
  filterCategoryId: string;
  filterDocType: string;
  searchText: string;
  canAdmin: boolean;
  onPolicyClick: (policy: PolicyDocument) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  onSearch: (text: string) => void;
  onCategoryFilter: (id: string) => void;
  onDocTypeFilter: (type: string) => void;
  onCreatePolicy: () => void;
}

const PolicyLibraryTemplate: React.FC<PolicyLibraryTemplateProps> = ({
  policies,
  categories,
  loading,
  viewMode,
  filterCategoryId,
  filterDocType,
  searchText,
  canAdmin,
  onPolicyClick,
  onViewModeChange,
  onSearch,
  onCategoryFilter,
  onDocTypeFilter,
  onCreatePolicy,
}) => {
  // Client-side filtering by search text
  const filteredPolicies = React.useMemo(() => {
    let result = policies;
    
    // Apply search filter
    if (searchText && searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter(policy => 
        policy.title?.toLowerCase().includes(searchLower) ||
        policy.description?.toLowerCase().includes(searchLower) ||
        policy.policyCode?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by publishedDateTime (newest first)
    result = [...result].sort((a, b) => {
      const dateA = a.publishedDateTime ? new Date(a.publishedDateTime).getTime() : 0;
      const dateB = b.publishedDateTime ? new Date(b.publishedDateTime).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
    
    return result;
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
      </Space>
      <Space>
        <Segmented
          value={viewMode}
          onChange={(v) => onViewModeChange(v as "grid" | "list")}
          size="middle"
          options={[
            { 
              value: "list", 
              icon: (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  height: "100%",
                  width: "100%"
                }}>
                  <p>List View</p>
                </div>
              )
            },
            { 
              value: "grid", 
              icon: (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  height: "100%",
                  width: "100%"
                }}>
                  <p>Grid View</p>
                </div>
              )
            },
          ]}
        />
        <Can I="add">
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreatePolicy}>
            New Policy
          </Button>
        </Can>
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
