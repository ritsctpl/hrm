'use client';

import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_ITEMS, SIDEBAR_BOTTOM_ITEMS } from '@/config/dashboardConfig';
import { getModuleIcon } from '@utils/moduleIconMap';

const QuickSwitcher: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  // Flatten all apps
  const allApps: { label: string; route: string }[] = [];
  [...SIDEBAR_ITEMS, ...SIDEBAR_BOTTOM_ITEMS].forEach((item) => {
    if (item.type === 'direct-nav' && item.route) {
      allApps.push({ label: t(item.labelKey), route: item.route });
    }
    item.apps?.forEach((app) => {
      allApps.push({ label: t(app.labelKey), route: app.route });
    });
  });
  allApps.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: '#fff' }}>
        <LayoutGrid size={20} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { maxHeight: 400, width: 240 } }}
      >
        {allApps.map((app) => {
          const Icon = getModuleIcon(app.route);
          return (
            <MenuItem
              key={app.route}
              onClick={() => { router.push(app.route); setAnchorEl(null); }}
              sx={{ fontSize: 13 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Icon size={16} />
              </ListItemIcon>
              <ListItemText>{app.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default QuickSwitcher;
