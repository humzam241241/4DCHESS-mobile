import { PlayerColor, PieceType, GameType } from './types';

export const SERVER_URL = 'https://chaturaji-server.onrender.com';

export const PLAYERS: PlayerColor[] = ['red', 'yellow', 'green', 'black'];

export const PLAYER_NAMES: Record<PlayerColor, string> = {
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  black: 'Black',
};

// Enochian renames Green → Blue in display
export const ENOCHIAN_PLAYER_NAMES: Record<PlayerColor, string> = {
  yellow: 'Yellow',
  green: 'Blue',
  red: 'Red',
  black: 'Black',
};

export const ENOCHIAN_TEAM_COLORS: Record<PlayerColor, string> = {
  red: 'A', yellow: 'A', green: 'B', black: 'B',
};

export const ENOCHIAN_TEAM_LABELS: Record<PlayerColor, string> = {
  red: 'Sulphur', yellow: 'Sulphur', green: 'Salt', black: 'Salt',
};

export const PIECE_ICONS: Record<PieceType, string> = {
  king: '\u265A',
  elephant: '\u265C',
  horse: '\u265E',
  boat: '\u265D',
  pawn: '\u265F',
  queen: '\u265B',
  bishop: '\u265D',
  rook: '\u265C',
  knight: '\u265E',
};

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  black: '#64748b',
};

// Board themes
// Simple themes use {light, dark}. Enochian elemental themes use per-quadrant dark colors.
// Quadrant index: 0=NW (Yellow/Air), 1=NE (Blue/Water), 2=SE (Red/Fire), 3=SW (Black/Earth)
export type BoardTheme = 'classic' | 'bw' | 'green' | 'air' | 'water' | 'earth' | 'fire';

export interface BoardThemeDef {
  light: string;
  dark: string;
  // When present, overrides `dark` per quadrant. Order: [NW, NE, SE, SW].
  quadrants?: [string, string, string, string];
  enochian?: boolean;
}

export const BOARD_THEMES: Record<BoardTheme, BoardThemeDef> = {
  classic: { light: '#8a7356', dark: '#5a0000' },
  bw:      { light: '#c0c0c0', dark: '#3a3a3a' },
  green:   { light: '#d0dcc4', dark: '#5c7a4e' },

  // Enochian elemental sub-boards — each quadrant mixes the board's element with a sub-element.
  // Air (Yellow) — board of Air: tinged yellow across all squares
  air: {
    light: '#f5e59a',
    dark:  '#c9a618',
    quadrants: ['#c9a618', '#7d9bb8', '#c25a28', '#4a4128'],
    enochian: true,
  },
  // Water (Blue) — board of Water: tinged blue
  water: {
    light: '#bcd6ea',
    dark:  '#2a5a85',
    quadrants: ['#8c9a5a', '#2a5a85', '#6a3545', '#1c2840'],
    enochian: true,
  },
  // Earth (Black/olive) — board of Earth: tinged dark
  earth: {
    light: '#a89876',
    dark:  '#1a1a1a',
    quadrants: ['#7e6a24', '#2a3c58', '#5c2a1a', '#1a1a1a'],
    enochian: true,
  },
  // Fire (Red) — board of Fire: tinged red
  fire: {
    light: '#e7b18a',
    dark:  '#9c1f1f',
    quadrants: ['#c87820', '#6a3a58', '#9c1f1f', '#3a1e18'],
    enochian: true,
  },
};

// Maps (row, col) on an 8x8 board to the quadrant index used by BOARD_THEMES.quadrants.
// 0=NW (rows 0-3, cols 0-3), 1=NE (0-3, 4-7), 2=SE (4-7, 4-7), 3=SW (4-7, 0-3)
export function quadrantIndex(row: number, col: number): 0 | 1 | 2 | 3 {
  if (row < 4) return col < 4 ? 0 : 1;
  return col < 4 ? 3 : 2;
}

export const COLORS = {
  bgPrimary: '#080810',
  bgSecondary: '#0f1018',
  bgCard: '#12141e',
  bgInput: '#0a0a14',
  text: '#f0ead6',
  textMuted: '#7a7060',
  textDim: '#a09880',
  border: 'rgba(212,175,55,0.15)',
  accent: '#D4AF37',
  accentHover: '#E5C249',
  danger: '#dc2626',
  success: '#16a34a',
  boardLight: '#8a7356',
  boardDark: '#5a0000',
};
