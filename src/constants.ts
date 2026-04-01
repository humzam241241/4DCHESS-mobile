import { PlayerColor, PieceType } from './types';

export const SERVER_URL = 'https://chaturaji-server.onrender.com';

export const PLAYERS: PlayerColor[] = ['red', 'yellow', 'green', 'black'];

export const PLAYER_NAMES: Record<PlayerColor, string> = {
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  black: 'Black',
};

export const PIECE_ICONS: Record<PieceType, string> = {
  king: '\u265A',
  elephant: '\u265C',
  horse: '\u265E',
  boat: '\u265D',
  pawn: '\u265F',
};

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  black: '#64748b',
};

export const COLORS = {
  bgPrimary: '#0e0e1c',
  bgSecondary: '#13141f',
  bgCard: 'rgba(20, 22, 38, 0.72)',
  bgInput: 'rgba(12, 12, 24, 0.65)',
  text: '#f0ead6',
  textMuted: '#7a7060',
  textDim: '#a09880',
  border: 'rgba(212,175,55,0.15)',
  accent: '#D4AF37',
  accentHover: '#E5C249',
  danger: '#dc2626',
  success: '#16a34a',
  boardLight: '#d4b896',
  boardDark: '#8B0000',
};
