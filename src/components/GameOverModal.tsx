import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { PlayerColor, Placements } from '../types';
import { PLAYER_NAMES, PLAYER_COLORS, COLORS } from '../constants';

const PLACEMENT_CONFIG = {
  gold:   { label: 'GOLD',   medal: '\u{1F947}', glowColor: '#FFD700' },
  silver: { label: 'SILVER', medal: '\u{1F948}', glowColor: '#C0C0C0' },
  bronze: { label: 'BRONZE', medal: '\u{1F949}', glowColor: '#CD7F32' },
  fourth: { label: '4TH',    medal: '4',         glowColor: '#64748b' },
} as const;

type PlacementKey = keyof typeof PLACEMENT_CONFIG;

interface GameOverModalProps {
  visible: boolean;
  winner: PlayerColor | null;
  winnerTeam?: string | null;
  placements?: Placements | null;
  myColor: PlayerColor | null;
  myColors?: PlayerColor[];
  turnNumber: number;
  moveCount: number;
  oddEvenCode?: string | null;
  playerPoints?: Record<string, number> | null;
  geomanticFigure?: { name: string; element: string; planet: string; sign: string } | null;
  onBackToLobby: () => void;
}

function getMyPlacement(placements: Placements, myColors: PlayerColor[]): PlacementKey | null {
  for (const key of ['gold', 'silver', 'bronze', 'fourth'] as PlacementKey[]) {
    if (placements[key] && myColors.includes(placements[key]!)) return key;
  }
  return null;
}

export default function GameOverModal({
  visible, winner, winnerTeam, placements, myColor, myColors, turnNumber, moveCount, oddEvenCode, playerPoints, geomanticFigure, onBackToLobby,
}: GameOverModalProps) {
  if (!winner) return null;

  const effectiveMyColors = myColors && myColors.length > 0 ? myColors : (myColor ? [myColor] : []);
  const myPlacement = placements ? getMyPlacement(placements, effectiveMyColors) : null;
  const myConfig = myPlacement ? PLACEMENT_CONFIG[myPlacement] : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* YOUR PLACEMENT — large and prominent */}
          {myConfig && (
            <View style={[styles.myRankCard, { borderColor: myConfig.glowColor, shadowColor: myConfig.glowColor }]}>
              <Text style={styles.myMedal}>{myConfig.medal}</Text>
              <Text style={[styles.myRankLabel, { color: myConfig.glowColor }]}>
                YOU GOT {myConfig.label}!
              </Text>
            </View>
          )}

          {/* Game winner title */}
          {winnerTeam ? (
            <Text style={styles.winnerTitle}>
              {winnerTeam === 'ry' ? 'Team Sulphur' : 'Team Salt'} Wins!
            </Text>
          ) : (
            <Text style={[styles.winnerTitle, { color: PLAYER_COLORS[winner as PlayerColor] || COLORS.accent }]}>
              {PLAYER_NAMES[winner as PlayerColor] || winner} Wins!
            </Text>
          )}

          {/* All placements list */}
          {placements && (
            <View style={styles.placementsList}>
              {(['gold', 'silver', 'bronze', 'fourth'] as PlacementKey[]).map(key => {
                const color = placements[key];
                if (!color) return null;
                const config = PLACEMENT_CONFIG[key];
                const isMe = effectiveMyColors.includes(color);
                return (
                  <View key={key} style={[styles.placementRow, isMe && styles.placementRowMe]}>
                    <Text style={styles.placementMedal}>{config.medal}</Text>
                    <Text style={[styles.placementName, { color: PLAYER_COLORS[color] || COLORS.text }]}>
                      {PLAYER_NAMES[color] || color}
                    </Text>
                    {isMe && <Text style={styles.youBadge}>YOU</Text>}
                    <Text style={[styles.placementLabel, { color: config.glowColor }]}>{config.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Odd/Even Code Display */}
          {oddEvenCode && (
            <View style={styles.oddEvenSection}>
              <Text style={styles.oddEvenLabel}>FORTUNE CODE</Text>
              <View style={styles.oddEvenRow}>
                {oddEvenCode.split('').map((digit, i) => {
                  const ranks = ['gold', 'silver', 'bronze', 'fourth'] as PlacementKey[];
                  const color = placements?.[ranks[i]] || null;
                  return (
                    <View key={i} style={[styles.oddEvenDigit, { borderColor: color ? PLAYER_COLORS[color] : COLORS.border }]}>
                      <Text style={styles.oddEvenDigitText}>{digit}</Text>
                      <Text style={styles.oddEvenDigitLabel}>
                        {digit === '1' ? 'ODD' : digit === '2' ? 'EVEN' : '-'}
                      </Text>
                      {color && playerPoints?.[color] !== undefined && (
                        <Text style={[styles.oddEvenPts, { color: PLAYER_COLORS[color] }]}>
                          {playerPoints[color]}pts
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.oddEvenCode}>{oddEvenCode}</Text>
              {/* Geomantic Figure */}
              {geomanticFigure && (
                <View style={styles.geomanticCard}>
                  <Text style={styles.geomanticName}>{geomanticFigure.name}</Text>
                  <View style={styles.geomanticDetails}>
                    <View style={styles.geomanticDetail}>
                      <Text style={styles.geomanticDetailLabel}>Element</Text>
                      <Text style={styles.geomanticDetailValue}>{geomanticFigure.element}</Text>
                    </View>
                    <View style={styles.geomanticDetail}>
                      <Text style={styles.geomanticDetailLabel}>Planet</Text>
                      <Text style={styles.geomanticDetailValue}>{geomanticFigure.planet}</Text>
                    </View>
                    <View style={styles.geomanticDetail}>
                      <Text style={styles.geomanticDetailLabel}>Sign</Text>
                      <Text style={styles.geomanticDetailValue}>{geomanticFigure.sign}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    maxWidth: '95%',
    width: 360,
  },
  // YOUR rank — large and prominent
  myRankCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  myMedal: { fontSize: 48 },
  myRankLabel: { fontSize: 22, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  // Winner title
  winnerTitle: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: COLORS.accent },
  // All placements
  placementsList: {
    width: '100%',
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  placementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  placementRowMe: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  placementMedal: { fontSize: 20, width: 32, textAlign: 'center' },
  placementName: { flex: 1, fontSize: 15, fontWeight: '600' },
  placementLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  youBadge: {
    fontSize: 9, fontWeight: '800', color: COLORS.accent,
    backgroundColor: 'rgba(212,175,55,0.2)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    marginRight: 8,
  },
  // Odd/Even code
  oddEvenSection: {
    width: '100%', marginBottom: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  oddEvenLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.textDim,
    letterSpacing: 1.5, marginBottom: 8,
  },
  oddEvenRow: { flexDirection: 'row', gap: 8 },
  oddEvenDigit: {
    width: 60, paddingVertical: 8, alignItems: 'center',
    borderRadius: 10, borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  oddEvenDigitText: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  oddEvenDigitLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textDim, marginTop: 2 },
  oddEvenPts: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  oddEvenCode: {
    fontSize: 18, fontWeight: '800', color: COLORS.accent,
    letterSpacing: 6, marginTop: 8,
  },
  // Geomantic figure
  geomanticCard: {
    marginTop: 12, width: '100%', padding: 12,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center',
  },
  geomanticName: {
    fontSize: 18, fontWeight: '800', color: COLORS.accent,
    letterSpacing: 1, marginBottom: 8,
  },
  geomanticDetails: { flexDirection: 'row', gap: 16 },
  geomanticDetail: { alignItems: 'center' },
  geomanticDetailLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textDim, letterSpacing: 0.5 },
  geomanticDetailValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  stats: { color: COLORS.textDim, fontSize: 13, marginBottom: 20, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
