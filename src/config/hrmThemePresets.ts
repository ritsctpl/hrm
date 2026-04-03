export interface HrmThemePreset {
  key: string;
  name: string;
  accentStart: string;
  accentEnd: string;
  variables: Record<string, string>;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function lightenForBg(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  // Mix with white at 96% to get a very light tint
  const lr = Math.round(r + (255 - r) * 0.96);
  const lg = Math.round(g + (255 - g) * 0.96);
  const lb = Math.round(b + (255 - b) * 0.96);
  return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
}

function darken(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(h.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function textOnColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

export function buildPreset(
  key: string,
  name: string,
  start: string,
  end: string,
): HrmThemePreset {
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);
  const bgTint = lightenForBg(start);
  const appBarText = textOnColor(start);

  return {
    key,
    name,
    accentStart: start,
    accentEnd: end,
    variables: {
      // Module accent colors
      '--hrm-accent':          start,
      '--hrm-accent-hover':    darken(start, 0.1),
      '--hrm-accent-light':    `rgba(${startRgb}, 0.1)`,
      '--hrm-accent-mid':      `rgba(${startRgb}, 0.18)`,
      '--hrm-accent-end':      end,
      '--hrm-gradient':        `linear-gradient(135deg, ${start}, ${end})`,
      '--hrm-gradient-subtle': `linear-gradient(135deg, rgba(${startRgb},0.06), rgba(${endRgb},0.06))`,
      '--hrm-bg-primary':      bgTint,
      '--hrm-bg-hover':        `rgba(${startRgb}, 0.05)`,
      '--hrm-bg-active':       `rgba(${startRgb}, 0.08)`,
      '--hrm-shadow-accent':   `0 4px 14px rgba(${startRgb}, 0.25)`,
      '--hrm-shadow-glow':     `0 0 20px rgba(${startRgb}, 0.15)`,
      '--hrm-border-accent':   `rgba(${startRgb}, 0.2)`,
      '--hrm-text-accent':     start,
      '--hrm-mesh-bg': [
        `radial-gradient(ellipse at 10% 20%, rgba(${startRgb}, 0.05) 0%, transparent 50%)`,
        `radial-gradient(ellipse at 90% 80%, rgba(${endRgb}, 0.04) 0%, transparent 50%)`,
        `radial-gradient(ellipse at 50% 50%, rgba(${startRgb}, 0.03) 0%, transparent 70%)`,
        `linear-gradient(180deg, ${bgTint} 0%, #f1f5f9 100%)`,
      ].join(', '),
      // AppBar / global brand colors
      '--button-color':        start,
      '--icon-color':          start,
      '--tab-active-color':    start,
      '--tab-text-color':      start,
      '--background-color':    start,
      '--text-color':          appBarText,
      '--line-color':          start,
    },
  };
}

// =============================================
// CURATED PRESETS (shown as named themes)
// =============================================
export const HRM_THEME_PRESETS: HrmThemePreset[] = [
  buildPreset('indigo',   'Indigo',    '#6366f1', '#8b5cf6'),
  buildPreset('ocean',    'Ocean',     '#0ea5e9', '#06b6d4'),
  buildPreset('emerald',  'Emerald',   '#10b981', '#14b8a6'),
  buildPreset('rose',     'Rose',      '#f43f5e', '#e879f9'),
  buildPreset('slate',    'Slate',     '#475569', '#64748b'),
];

// =============================================
// COLOR PALETTE (full spectrum for custom pick)
// =============================================
export interface PaletteColor {
  key: string;
  name: string;
  color: string;
  endColor: string;
}

export const COLOR_PALETTE: PaletteColor[] = [
  // Reds
  { key: 'red-500',      name: 'Red',          color: '#ef4444', endColor: '#f97316' },
  { key: 'red-700',      name: 'Crimson',      color: '#b91c1c', endColor: '#dc2626' },
  { key: 'rose-500',     name: 'Rose',         color: '#f43f5e', endColor: '#e879f9' },

  // Oranges
  { key: 'orange-500',   name: 'Orange',       color: '#f97316', endColor: '#fbbf24' },
  { key: 'amber-500',    name: 'Amber',        color: '#f59e0b', endColor: '#fbbf24' },

  // Yellows / Limes
  { key: 'yellow-500',   name: 'Yellow',       color: '#eab308', endColor: '#a3e635' },
  { key: 'lime-500',     name: 'Lime',         color: '#84cc16', endColor: '#22d3ee' },

  // Greens
  { key: 'green-500',    name: 'Green',        color: '#22c55e', endColor: '#10b981' },
  { key: 'emerald-500',  name: 'Emerald',      color: '#10b981', endColor: '#14b8a6' },
  { key: 'teal-500',     name: 'Teal',         color: '#14b8a6', endColor: '#06b6d4' },

  // Cyans / Blues
  { key: 'cyan-500',     name: 'Cyan',         color: '#06b6d4', endColor: '#0ea5e9' },
  { key: 'sky-500',      name: 'Sky',          color: '#0ea5e9', endColor: '#3b82f6' },
  { key: 'blue-500',     name: 'Blue',         color: '#3b82f6', endColor: '#6366f1' },
  { key: 'blue-700',     name: 'Royal Blue',   color: '#1d4ed8', endColor: '#3b82f6' },

  // Indigos / Violets
  { key: 'indigo-500',   name: 'Indigo',       color: '#6366f1', endColor: '#8b5cf6' },
  { key: 'violet-500',   name: 'Violet',       color: '#8b5cf6', endColor: '#a855f7' },
  { key: 'purple-500',   name: 'Purple',       color: '#a855f7', endColor: '#d946ef' },
  { key: 'fuchsia-500',  name: 'Fuchsia',      color: '#d946ef', endColor: '#f43f5e' },

  // Pinks
  { key: 'pink-500',     name: 'Pink',         color: '#ec4899', endColor: '#f43f5e' },

  // Neutrals / Darks
  { key: 'slate-500',    name: 'Slate',        color: '#475569', endColor: '#64748b' },
  { key: 'slate-800',    name: 'Charcoal',     color: '#1e293b', endColor: '#334155' },
  { key: 'zinc-600',     name: 'Zinc',         color: '#52525b', endColor: '#71717a' },
  { key: 'stone-600',    name: 'Stone',        color: '#57534e', endColor: '#78716c' },

  // Corporate
  { key: 'corp-navy',    name: 'Navy',         color: '#124561', endColor: '#1e6a8a' },
  { key: 'corp-forest',  name: 'Forest',       color: '#166534', endColor: '#15803d' },
  { key: 'corp-maroon',  name: 'Maroon',       color: '#881337', endColor: '#be123c' },
  { key: 'corp-brown',   name: 'Brown',        color: '#78350f', endColor: '#a16207' },
];

export function buildFromPalette(palette: PaletteColor): HrmThemePreset {
  return buildPreset(palette.key, palette.name, palette.color, palette.endColor);
}

export const DEFAULT_THEME_KEY = 'indigo';
export const STORAGE_KEY = 'hrm-theme';

export function getPresetByKey(key: string): HrmThemePreset {
  // Check curated presets first
  const curated = HRM_THEME_PRESETS.find(p => p.key === key);
  if (curated) return curated;

  // Check palette colors
  const paletteColor = COLOR_PALETTE.find(p => p.key === key);
  if (paletteColor) return buildFromPalette(paletteColor);

  // Fallback to default
  return HRM_THEME_PRESETS.find(p => p.key === DEFAULT_THEME_KEY)!;
}
