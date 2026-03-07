'use client';

import React, { useMemo } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';

interface HrmExportButtonProps {
  onExport: (format: string) => void;
  formats: string[];
}

/**
 * HrmExportButton
 *
 * A dropdown button that offers multiple export format options.
 * When a format is selected, `onExport` is called with the format key.
 *
 * @param onExport - Callback invoked with the chosen format string
 * @param formats  - List of format labels (e.g. ["CSV", "PDF", "Excel"])
 */
const HrmExportButton: React.FC<HrmExportButtonProps> = ({
  onExport,
  formats,
}) => {
  const menuItems: MenuProps['items'] = useMemo(
    () =>
      formats.map((format) => ({
        key: format,
        label: format,
      })),
    [formats],
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    onExport(key);
  };

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={['click']}
    >
      <Button
        icon={
          <FileDownloadOutlined
            style={{ fontSize: 16, verticalAlign: 'middle' }}
          />
        }
      >
        Export
      </Button>
    </Dropdown>
  );
};

export default HrmExportButton;
