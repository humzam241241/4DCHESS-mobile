import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { PlayerColor } from '../types';
import { PLAYER_NAMES, PLAYER_COLORS, COLORS } from '../constants';

interface GameOverModalProps {
  visible: boolean;
  winner: PlayerColor | null;
  turnNumber: number;
  moveCount: number;
  onBackToLobby: () => void;
}

export default function GameOverModal({ visible, winner, turnNumber, moveCount, onBackToLobby }: GameOverModalProps) {
  if (!winner) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: PLAYER_COLORS[winner] }]}>
            {PLAYER_NAMES[winner]} Wins!
          </Text>
          <Text style={styles.stats}>
            Game lasted {turnNumber} turns with {moveCount} moves
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onBackToLobby} style={styles.primaryBtn}>
              <Text style={styles.btnText}>Back to Lobby</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
    maxWidth: '90%',
  },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  stats: { color: COLORS.textDim, fontSize: 14, marginBottom: 24, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
