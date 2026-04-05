import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MoveRecord } from '../types';
import { PLAYER_NAMES, PLAYER_COLORS, COLORS } from '../constants';

interface MoveHistoryProps {
  moves: MoveRecord[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [moves.length]);

  if (moves.length === 0) {
    return <Text style={styles.empty}>No moves yet</Text>;
  }

  return (
    <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
      {moves.map((m, i) => {
        const capText = m.captured ? ` x${m.captured.type}` : '';
        const isKingCap = m.captured?.type === 'king';
        return (
          <View key={i} style={[styles.entry, isKingCap && styles.kingCapture]}>
            <Text style={styles.turnNum}>{m.turn}.</Text>
            <Text style={[styles.playerName, { color: PLAYER_COLORS[m.player] }]}>
              {PLAYER_NAMES[m.player]}
            </Text>
            <Text style={styles.moveText}>
              {m.piece} {m.from.notation}-{m.to.notation}
            </Text>
            {m.captured && (
              <Text style={styles.capture}>{capText}</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  empty: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 12 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  kingCapture: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  turnNum: { color: COLORS.textMuted, fontSize: 11, marginRight: 4, fontFamily: 'Courier' },
  playerName: { fontWeight: '600', fontSize: 11 },
  moveText: { color: COLORS.text, fontSize: 11, fontFamily: 'Courier' },
  capture: { color: COLORS.danger, fontWeight: '600', fontSize: 11 },
});
