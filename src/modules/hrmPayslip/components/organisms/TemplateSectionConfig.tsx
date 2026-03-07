'use client';

import React from "react";
import SectionToggle from "../atoms/SectionToggle";
import { TEMPLATE_SECTIONS } from "../../utils/payslipConstants";

const TemplateSectionConfig: React.FC = () => (
  <div>
    {TEMPLATE_SECTIONS.map((section) => (
      <SectionToggle key={section.key} name={section.key} label={section.label} />
    ))}
  </div>
);

export default TemplateSectionConfig;
