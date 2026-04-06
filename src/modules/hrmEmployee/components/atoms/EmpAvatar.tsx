/**
 * EmpAvatar - Atom component for employee avatar with initials fallback
 */

'use client';

import React from 'react';
import { Avatar } from 'antd';
import { getInitials } from '../../utils/transformations';
import type { EmpAvatarProps } from '../../types/ui.types';

/** Deterministic color from name string */
function avatarColor(name: string): string {
  const colors = [
    '#1a237e', '#0277bd', '#00695c', '#2e7d32',
    '#558b2f', '#f57f17', '#e65100', '#ad1457',
    '#6a1b9a', '#4527a0', '#283593', '#00838f',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const EmpAvatar: React.FC<EmpAvatarProps> = ({ name, photoUrl, photoBase64, size = 40, shape = 'circle' }) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Only use valid image sources (base64 or data URLs)
  // Ignore file paths that might not exist and cause 404 errors
  const imageSource = React.useMemo(() => {
    // Priority 1: photoBase64 (direct base64 string)
    if (photoBase64 && photoBase64.trim()) {
      return photoBase64;
    }
    
    // Priority 2: photoUrl only if it's a data URL
    if (photoUrl && photoUrl.trim()) {
      // Only accept data URLs (base64 encoded images)
      if (photoUrl.startsWith('data:image/')) {
        return photoUrl;
      }
      // Reject all file paths to prevent 404 errors
      // This includes: /uploads/..., /rits/uploads/..., etc.
    }
    
    return null;
  }, [photoBase64, photoUrl]);
  
  // Reset error state when image source changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageSource]);

  // Passport size shape (rectangular)
  if (shape === 'passport') {
    if (imageSource && !imageError) {
      return (
        <img 
          src={imageSource} 
          alt={name}
          onError={() => setImageError(true)}
          style={{
            width: '100px',
            height: '130px',
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid #e2e8f0'
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: '100px',
          height: '130px',
          backgroundColor: avatarColor(name),
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 600,
          color: '#fff',
        }}
      >
        {getInitials(name)}
      </div>
    );
  }

  // Default circular avatar
  if (imageSource && !imageError) {
    return (
      <Avatar 
        src={imageSource} 
        size={size} 
        alt={name}
        onError={() => {
          setImageError(true);
          return true;
        }}
      />
    );
  }

  return (
    <Avatar
      size={size}
      style={{ backgroundColor: avatarColor(name), fontWeight: 600, fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </Avatar>
  );
};

export default EmpAvatar;
