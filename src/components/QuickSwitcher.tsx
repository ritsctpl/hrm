'use client';

import React, { useState, useMemo } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import { getModuleIcon } from '@utils/moduleIconMap';

const QuickSwitcher: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const currentOrgModules = useHrmRbacStore((s) => s.currentOrgModules);

  // Build flat sorted list from API modules
  const allApps = useMemo(() => {
    return currentOrgModules
      .map((mod) => ({ label: mod.moduleName, route: mod.appUrl }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [currentOrgModules]);

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
