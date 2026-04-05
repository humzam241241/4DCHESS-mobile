import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameState, Player, PlayerColor, GameType } from '../types';
import { PLAYER_NAMES, ENOCHIAN_PLAYER_NAMES, ENOCHIAN_TEAM_LABELS, PLAYER_COLORS, COLORS } from '../constants';

interface PlayersListProps {
  players: Player[];
  gameState: GameState;
  myColor: PlayerColor | null;
  gameType?: GameType;
}

function countPieces(board: (any | null)[][], color: string): number {
  let n = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.color === color) {
        n++;
        if (p.thronePartner?.color === color) n++;
      }
    }
  return n;
}

export default function PlayersList({ players, gameState, myColor, gameType = 'classic' }: PlayersListProps) {
  const isEnochian = gameType === 'enochian';
  const frozen = gameState.frozen || [];

  return (
    <View style={styles.container}>
      {players.map(p => {
        const isElim = gameState.eliminated.includes(p.color);
        const isFrozen = frozen.includes(p.color);
        const isCurrent = gameState.currentPlayer === p.color && !gameState.winner;
        const pieces = countPieces(gameState.board, p.color);

        return (
          <View key={p.color} style={[styles.row, (isElim || isFrozen) && styles.eliminated]}>
            <View style={[styles.dot, { backgroundColor: PLAYER_COLORS[p.color] }]} />
            <Text style={[styles.name, isCurrent && styles.currentName, isElim && styles.elimText]} numberOfLines={1}>
              {p.name}
            </Text>
            {isEnochian && (
              <View style={[styles.teamBadge, ENOCHIAN_TEAM_LABELS[p.color] === 'Sulphur' ? styles.teamA : styles.teamB]}>
                <Text style={styles.teamText}>{ENOCHIAN_TEAM_LABELS[p.color]}</Text>
              </View>
            )}
            {p.color === myColor && (
              <View style={styles.youBadge}>
                <Text style={styles.youText}>YOU</Text>
              </View>
            )}
            {isFrozen && (
              <View style={styles.frozenBadge}>
                <Text style={styles.frozenText}>FROZEN</Text>
              </View>
            )}
            {!p.connected && p.socket_id !== null && (
              <Text style={styles.dc}>DC</Text>
            )}
            <Text style={styles.pieces}>{pieces}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, color: COLORS.text, fontSize: 13 },
  currentName: { fontWeight: '700' },
  eliminated: { opacity: 0.3 },
  elimText: { textDecorationLine: 'line-through' },
  teamBadge: {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10,
  },
  teamA: { backgroundColor: 'rgba(239,68,68,0.2)' },
  teamB: { backgroundColor: 'rgba(59,130,246,0.2)' },
  teamText: { fontSize: 9, fontWeight: '700', color: COLORS.textDim },
  youBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  youText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  frozenBadge: {
    backgroundColor: 'rgba(147,197,253,0.2)',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10,
  },
  frozenText: { color: '#93c5fd', fontSize: 9, fontWeight: '700' },
  dc: { color: COLORS.danger, fontSize: 10 },
  pieces: { color: COLORS.textDim, fontSize: 11 },
});
