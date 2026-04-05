import { createContext, useContext } from 'react';
import { GameState, Player, PlayerColor, GameType, MoveRecord, ChatMessage } from './types';

export interface GameStore {
  myColor: PlayerColor | null;
  myName: string;
  gameId: string | null;
  roomCode: string | null;
  gameType: GameType;
  gameState: GameState | null;
  players: Player[];
  moveHistory: MoveRecord[];
  chatMessages: ChatMessage[];
  setMyColor: (c: PlayerColor | null) => void;
  setMyName: (n: string) => void;
  setGameId: (id: string | null) => void;
  setRoomCode: (c: string | null) => void;
  setGameType: (t: GameType) => void;
  setGameState: (s: GameState | null) => void;
  setPlayers: (p: Player[]) => void;
  addMove: (m: MoveRecord) => void;
  setMoveHistory: (m: MoveRecord[]) => void;
  addChat: (c: ChatMessage) => void;
  setChatMessages: (c: ChatMessage[]) => void;
  reset: () => void;
}

export const GameContext = createContext<GameStore>(null as any);
export const useGame = () => useContext(GameContext);
