'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, InputAdornment } from '@mui/material';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TASK_SHORTCUTS } from '@/config/dashboardConfig';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import { getModuleIcon } from '@utils/moduleIconMap';

interface SearchOption {
  type: 'app' | 'task';
  label: string;
  subLabel?: string;
  route: string;
  iconRoute?: string;
}

const EnhancedSearch: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentOrgModules = useHrmRbacStore((s) => s.currentOrgModules);

  // Build options list from API modules
  const options = useMemo<SearchOption[]>(() => {
    const opts: SearchOption[] = [];

    // Add all accessible modules from RBAC
    currentOrgModules.forEach((mod) => {
      opts.push({
        type: 'app',
        label: mod.moduleName,
        subLabel: mod.description || mod.moduleCategory,
        route: mod.appUrl,
        iconRoute: mod.appUrl,
      });
    });

    // Add task shortcuts
    TASK_SHORTCUTS.forEach((task) => {
      opts.push({
        type: 'task',
        label: task.label,
        route: task.route,
      });
    });

    return opts;
  }, [currentOrgModules]);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <Autocomplete
      options={options}
      groupBy={(option) => option.type === 'app' ? 'Apps' : 'Tasks'}
      getOptionLabel={(option) => option.label}
      onChange={(_, option) => {
        if (option) router.push(option.route);
      }}
      renderOption={(props, option) => {
        const Icon = option.iconRoute ? getModuleIcon(option.iconRoute) : Search;
        return (
          <li {...props} key={option.label + option.route}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <Icon size={16} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{option.label}</div>
                {option.subLabel && (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{option.subLabel}</div>
                )}
              </div>
            </div>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder={t('dashboard.search.placeholder')}
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#94a3b8" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 360,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              fontSize: 13,
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
            },
            '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
          }}
        />
      )}
      clearOnBlur
      blurOnSelect
      sx={{ flexGrow: 1, maxWidth: 400 }}
    />
  );
};

export default EnhancedSearch;
