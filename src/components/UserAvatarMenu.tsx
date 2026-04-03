'use client';

import React, { useState } from 'react';
import { Avatar, IconButton, Menu, MenuItem, Divider, Typography } from '@mui/material';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserAvatarMenuProps {
  photoUrl?: string;
  userName?: string;
  designation?: string;
}

const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({ photoUrl, userName, designation }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { logout } = useAuth();

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
        <Avatar
          src={photoUrl || undefined}
          sx={{ width: 32, height: 32, bgcolor: photoUrl ? 'transparent' : '#475569' }}
        >
          {!photoUrl && <User size={18} color="#fff" />}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 220, mt: 1 } }}
      >
        <div style={{ padding: '8px 16px' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{userName || 'User'}</Typography>
          {designation && <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>{designation}</Typography>}
        </div>
        <Divider />
        <MenuItem onClick={() => { logout(); setAnchorEl(null); }} sx={{ fontSize: 13, color: '#ef4444' }}>
          <LogOut size={16} style={{ marginRight: 8 }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserAvatarMenu;
