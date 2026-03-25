"use client";

import React from "react";
import { Button, Space, Select, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PolicyDocument, PolicyCategory } from "../../types/domain.types";
import PolicyAdminTable from "../organisms/PolicyAdminTable";
import PolicyFormDrawer from "../organisms/PolicyFormDrawer";
import styles from "../../styles/PolicyAdmin.module.css";

const { Option } = Select;

interface PolicyAdminTemplateProps {
  policies: PolicyDocument[];
  categories: PolicyCategory[];
  loading: boolean;
  showFormDrawer: boolean;
  editPolicy: PolicyDocument | null;
  site: string;
  searchText?: string;
  filterCategoryId?: string;
  filterDocType?: string;
  filterStatus?: string;
  onEdit: (policy: PolicyDocument) => void;
  onPublish: (policyId: string) => void;
  onArchive: (policyId: string) => void;
  onViewDetail: (policy: PolicyDocument) => void;
  onCreateNew: () => void;
  onDrawerClose: () => void;
  onDrawerSaved: () => void;
  onSearch?: (text: string) => void;
  onCategoryFilter?: (id: string) => void;
  onDocTypeFilter?: (type: string) => void;
  onStatusFilter?: (status: string) => void;
}

const PolicyAdminTemplate: React.FC<PolicyAdminTemplateProps> = ({
  policies,
  categories,
  loading,
  showFormDrawer,
  editPolicy,
  site,
  searchText = "",
  filterCategoryId = "",
  filterDocType = "",
  filterStatus = "",
  onEdit,
  onPublish,
  onArchive,
  onViewDetail,
  onCreateNew,
  onDrawerClose,
  onDrawerSaved,
  onSearch,
  onCategoryFilter,
  onDocTypeFilter,
  onStatusFilter,
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
    <div className={styles.adminTemplate}>
    <div className={styles.adminToolbar}>
      <Space wrap>
        {onSearch && (
          <Input.Search
            placeholder="Search policies..."
            value={searchText}
            onChange={(e) => onSearch(e.target.value)}
            onSearch={(value) => onSearch(value)}
            style={{ width: 240 }}
            allowClear
          />
        )}
        {onCategoryFilter && (
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
        )}
        {onDocTypeFilter && (
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
        )}
        {onStatusFilter && (
          <Select
            placeholder="Status"
            value={filterStatus || undefined}
            allowClear
            onChange={(v) => onStatusFilter(v || "")}
            style={{ width: 130 }}
          >
            <Option value="DRAFT">Draft</Option>
            <Option value="REVIEW">Under Review</Option>
            <Option value="APPROVED">Approved</Option>
            <Option value="PUBLISHED">Published</Option>
            <Option value="RETIRED">Retired</Option>
            <Option value="SUPERSEDED">Superseded</Option>
          </Select>
        )}
      </Space>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreateNew}>
        New Policy
      </Button>
    </div>
    <PolicyAdminTable
      policies={filteredPolicies}
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
};

export default PolicyAdminTemplate;
