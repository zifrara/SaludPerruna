import { useColorScheme } from 'react-native';

// ─── Static palette ────────────────────────────────
export const palette = {
  green:      '#22C55E',
  greenMid:   '#16A34A',
  greenPale:  '#DCFCE7',
  amber:      '#F59E0B',
  amberPale:  '#FEF3C7',
  blue:       '#3B82F6',
  bluePale:   '#DBEAFE',
  red:        '#EF4444',
  redPale:    '#FEE2E2',
  yellow:     '#EAB308',
  yellowPale: '#FEF9C3',
  purple:     '#A855F7',
  purplePale: '#F3E8FF',
  pink:       '#EC4899',
  pinkPale:   '#FCE7F3',
  white:      '#FFFFFF',
  black:      '#000000',
} as const;

// ─── Semantic tokens (light) ───────────────────────
const light = {
  bg:       '#F0FDF4',
  surface:  '#FFFFFF',
  surface2: '#F8FAFC',
  border:   '#E2E8F0',
  fg:       '#1E293B',
  fgMid:    '#475569',
  fgMuted:  '#94A3B8',
  ...palette,
};

// ─── Semantic tokens (dark) ────────────────────────
const dark = {
  bg:       '#0F1A14',
  surface:  '#1A2922',
  surface2: '#1F3229',
  border:   '#2A3F35',
  fg:       '#E8F5EC',
  fgMid:    '#9CBDAB',
  fgMuted:  '#5A7A68',
  ...palette,
  greenPale:  '#153A22',
  amberPale:  '#3A2A08',
  bluePale:   '#0F2040',
  redPale:    '#3A1010',
  yellowPale: '#2A1F04',
  purplePale: '#1F0F3A',
  pinkPale:   '#3A0F20',
};

export type Colors = typeof light;

// ─── Hook ─────────────────────────────────────────
export function useColors(): Colors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

// ─── Dog avatar background options ────────────────
export const DOG_BG_COLORS = [
  '#FEF9C3', // yellow
  '#DBEAFE', // blue
  '#DCFCE7', // green
  '#FCE7F3', // pink
  '#FEF3C7', // amber
  '#EDE9FE', // purple
  '#FEE2E2', // red
  '#E0F2FE', // sky
];

// ─── Dog emoji options ─────────────────────────────
export const DOG_EMOJIS = ['🐕', '🐶', '🦮', '🐩', '🐾', '🦴', '🐕‍🦺', '🐈', '🐇', '🐿️', '🦊', '🦝', '🐺'];
