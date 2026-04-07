export type PlayerColor = 'red' | 'yellow' | 'green' | 'black';
export type PieceType = 'king' | 'elephant' | 'horse' | 'boat' | 'pawn' | 'queen' | 'bishop' | 'rook' | 'knight';
export type Phase = 'roll' | 'move' | 'finished';
export type DieFace = 'king' | 'elephant' | 'horse' | 'boat';
export type GameType = 'classic' | 'enochian';

export interface Piece {
  type: PieceType;
  color: PlayerColor;
  thronePartner?: Piece;
}

export interface Placements {
  gold: PlayerColor | null;
  silver: PlayerColor | null;
  bronze: PlayerColor | null;
  fourth: PlayerColor | null;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: PlayerColor;
  eliminated: PlayerColor[];
  eliminationOrder?: PlayerColor[];
  dice: [DieFace, DieFace] | null;
  diceUsed: [boolean, boolean];
  winner: PlayerColor | null;
  winnerTeam?: string;
  placements?: Placements | null;
  frozen?: PlayerColor[];
  turnNumber: number;
  phase: Phase;
}

export interface Player {
  id: number;
  game_id: string;
  color: PlayerColor;
  name: string;
  socket_id: string | null;
  connected: number;
  joined_at: string;
}

export interface MoveRecord {
  turn: number;
  player: PlayerColor;
  piece: PieceType;
  from: { row: number; col: number; notation: string };
  to: { row: number; col: number; notation: string };
  captured: { type: PieceType; color: PlayerColor } | null;
  dice: [DieFace, DieFace];
  timestamp?: number;
}

export interface DbMove {
  id: number;
  game_id: string;
  turn_number: number;
  player_color: PlayerColor;
  piece_type: PieceType;
  from_row: number;
  from_col: number;
  to_row: number;
  to_col: number;
  captured_type: PieceType | null;
  captured_color: PlayerColor | null;
  dice_1: DieFace;
  dice_2: DieFace;
  notation: string;
}

export interface ChatMessage {
  color: PlayerColor | '';
  name: string;
  message: string;
  timestamp?: number;
}

export type RootStackParamList = {
  Lobby: undefined;
  Waiting: undefined;
  Game: undefined;
};
