"use client";

import React from "react";
import { Typography } from "antd";
import { PolicyContentRendererProps } from "../../types/ui.types";
import styles from "../../styles/PolicyViewer.module.css";

const PolicyContentRenderer: React.FC<PolicyContentRendererProps> = ({
  content,
  attachmentUrl,
  contentType = "html",
}) => {
  if (contentType === "pdf" && attachmentUrl) {
    return (
      <iframe
        src={attachmentUrl}
        className={styles.pdfFrame}
        title="Policy Document"
      />
    );
  }

  if (content) {
    return (
      <div
        className={styles.htmlContent}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <Typography.Text type="secondary">
      No content available for this policy document.
    </Typography.Text>
  );
};

export default PolicyContentRenderer;
