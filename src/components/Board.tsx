import React from 'react';
import { View, Pressable, Text, StyleSheet, Dimensions } from 'react-native';
import { GameState, PlayerColor } from '../types';
import { PIECE_ICONS, PLAYER_COLORS, COLORS, BOARD_THEMES, BoardTheme, quadrantIndex } from '../constants';

interface BoardProps {
  gameState: GameState;
  myColor: PlayerColor | null;
  selectedCell: { row: number; col: number } | null;
  validMoves: { row: number; col: number }[];
  lastMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
  onCellPress: (row: number, col: number) => void;
  disabled?: boolean;
  boardTheme?: BoardTheme;
}

export default function Board({ gameState, myColor, selectedCell, validMoves, lastMove, onCellPress, disabled, boardTheme = 'classic' }: BoardProps) {
  const screenWidth = Dimensions.get('window').width;
  const cellSize = Math.floor((screenWidth - 32) / 8);
  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.classic;
  const frozen = gameState.frozen || [];

  return (
    <View style={[styles.board, { width: cellSize * 8 + 4, height: cellSize * 8 + 4 }]}>
      {Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => {
          const isLight = (r + c) % 2 === 0;
          const darkColor = theme.quadrants ? theme.quadrants[quadrantIndex(r, c)] : theme.dark;
          const squareColor = isLight ? theme.light : darkColor;
          const piece = gameState.board[r][c];
          const isSelected = selectedCell?.row === r && selectedCell?.col === c;
          const isValidMove = validMoves.some(m => m.row === r && m.col === c);
          const isCapture = isValidMove && !!piece;
          const isLastMove = lastMove && (
            (lastMove.from.row === r && lastMove.from.col === c) ||
            (lastMove.to.row === r && lastMove.to.col === c)
          );
          const isFrozen = piece && frozen.includes(piece.color);

          return (
            <Pressable
              key={`${r}-${c}`}
              onPress={() => !disabled && onCellPress(r, c)}
              style={[
                styles.cell,
                { width: cellSize, height: cellSize, backgroundColor: squareColor },
                isLastMove && styles.cellLastMove,
                isSelected && styles.cellSelected,
                isCapture && styles.cellCapture,
              ]}
            >
              {isValidMove && !piece && <View style={styles.moveIndicator} />}
              {piece && (
                <View style={[styles.pieceWrap, isFrozen && styles.frozenPiece]}>
                  <Text style={[styles.piece, { fontSize: cellSize * 0.55, color: PLAYER_COLORS[piece.color] }]}>
                    {PIECE_ICONS[piece.type]}
                  </Text>
                  {/* Throne partner (Enochian: king+bishop stacked on corner) */}
                  {piece.thronePartner && (
                    <Text style={[styles.thronePartner, { fontSize: cellSize * 0.3, color: PLAYER_COLORS[piece.thronePartner.color] }]}>
                      {PIECE_ICONS[piece.thronePartner.type]}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.7)',
    borderRadius: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#ffeb3b',
  },
  cellLastMove: {
    backgroundColor: 'rgba(255, 235, 59, 0.3)',
  },
  cellCapture: {
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  moveIndicator: {
    width: '30%',
    height: '30%',
    borderRadius: 100,
    backgroundColor: 'rgba(34, 197, 94, 0.55)',
    position: 'absolute',
  },
  pieceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  frozenPiece: {
    opacity: 0.35,
  },
  thronePartner: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
