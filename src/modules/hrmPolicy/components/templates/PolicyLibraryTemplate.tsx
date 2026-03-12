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
}) => (
  <div className={styles.libraryTemplate}>
    <div className={styles.toolbar}>
      <Space wrap>
        <Input.Search
          placeholder="Search policies..."
          value={searchText}
          onChange={(e) => onSearch(e.target.value)}
          onSearch={onSearch}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder="Category"
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
          value={viewMode}
          onChange={(v) => onViewModeChange(v as "grid" | "list")}
          options={[
            { value: "grid", icon: <AppstoreOutlined /> },
            { value: "list", icon: <BarsOutlined /> },
          ]}
        />
        {canAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreatePolicy}>
            New Policy
          </Button>
        )}
      </Space>
    </div>
    {viewMode === "grid" ? (
      <PolicyLibraryGrid
        policies={policies}
        categories={categories}
        loading={loading}
        onPolicyClick={onPolicyClick}
      />
    ) : (
      <PolicyLibraryList
        policies={policies}
        loading={loading}
        onPolicyClick={onPolicyClick}
      />
    )}
  </div>
);

export default PolicyLibraryTemplate;
