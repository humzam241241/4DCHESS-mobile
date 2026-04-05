import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { GameState, PlayerColor } from '../types';
import { COLORS } from '../constants';

interface DicePanelProps {
  gameState: GameState;
  myColor: PlayerColor | null;
  onRoll: () => void;
  onSkip: () => void;
  rolling?: boolean;
}

export default function DicePanel({ gameState, myColor, onRoll, onSkip, rolling }: DicePanelProps) {
  const isMyTurn = gameState.currentPlayer === myColor;
  const hasDice = !!gameState.dice;
  const canRoll = isMyTurn && !hasDice && !gameState.winner;
  const canSkip = isMyTurn && hasDice && !gameState.winner;

  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rolling) {
      spin1.setValue(0);
      spin2.setValue(0);
      Animated.parallel([
        Animated.timing(spin1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(spin2, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [rolling]);

  const rotate1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>DICE</Text>

      <Pressable
        onPress={onRoll}
        disabled={!canRoll}
        style={[styles.rollBtn, !canRoll && styles.disabled]}
      >
        <Text style={styles.rollBtnText}>Roll Dice</Text>
      </Pressable>

      <View style={styles.diceRow}>
        <Animated.View style={[
          styles.die,
          hasDice && !gameState.diceUsed[0] && styles.dieActive,
          hasDice && gameState.diceUsed[0] && styles.dieUsed,
          rolling && { transform: [{ rotateX: rotate1 }] },
        ]}>
          <Text style={[
            styles.dieText,
            hasDice && !gameState.diceUsed[0] && styles.dieTextActive,
            hasDice && gameState.diceUsed[0] && styles.dieTextUsed,
          ]}>
            {gameState.dice ? gameState.dice[0] : '-'}
          </Text>
        </Animated.View>

        <Animated.View style={[
          styles.die,
          hasDice && !gameState.diceUsed[1] && styles.dieActive,
          hasDice && gameState.diceUsed[1] && styles.dieUsed,
          rolling && { transform: [{ rotateX: rotate2 }] },
        ]}>
          <Text style={[
            styles.dieText,
            hasDice && !gameState.diceUsed[1] && styles.dieTextActive,
            hasDice && gameState.diceUsed[1] && styles.dieTextUsed,
          ]}>
            {gameState.dice ? gameState.dice[1] : '-'}
          </Text>
        </Animated.View>
      </View>

      {canSkip && (
        <Pressable onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip Remaining</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1 },
  rollBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  rollBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  disabled: { opacity: 0.4 },
  diceRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  die: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.bgInput,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieActive: { borderColor: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.1)' },
  dieUsed: { opacity: 0.25 },
  dieText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: COLORS.text, letterSpacing: 0.5 },
  dieTextActive: { color: '#eab308' },
  dieTextUsed: { textDecorationLine: 'line-through' },
  skipBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  skipBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
