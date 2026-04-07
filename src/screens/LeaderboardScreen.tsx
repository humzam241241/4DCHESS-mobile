import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SERVER_URL } from '../constants';
import { getAuthHeaders, getCurrentUserId } from '../auth';

type Props = { navigate: (screen: 'Lobby') => void };

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  wins: number;
  win_rate: number;
  ranking_points: number;
}

export default function LeaderboardScreen({ navigate }: Props) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    getCurrentUserId().then(id => setMyUserId(id)).catch(() => {});
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SERVER_URL}/api/leaderboard`, { headers });
      if (res.status === 403) {
        setError('Premium required to view the leaderboard.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRows(data);
    } catch {
      setError('Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  // Find current user's rank
  const myIndex = rows.findIndex(r => r.user_id === myUserId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate('Lobby')} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Leaderboard</Text>
        <Pressable onPress={loadLeaderboard} style={styles.backBtn}>
          <Text style={styles.backText}>Refresh</Text>
        </Pressable>
      </View>

      {/* Show current user's rank prominently if found */}
      {myIndex >= 0 && (
        <View style={styles.myRankBanner}>
          <Text style={styles.myRankMedal}>
            {myIndex === 0 ? '\u{1F947}' : myIndex === 1 ? '\u{1F948}' : myIndex === 2 ? '\u{1F949}' : `#${myIndex + 1}`}
          </Text>
          <View style={styles.myRankInfo}>
            <Text style={styles.myRankName}>Your Global Rank</Text>
            <Text style={styles.myRankPoints}>{rows[myIndex].ranking_points} pts</Text>
          </View>
          <View style={styles.myRankStats}>
            <Text style={styles.myStatValue}>{rows[myIndex].wins}</Text>
            <Text style={styles.myStatLabel}>Wins</Text>
          </View>
          <View style={styles.myRankStats}>
            <Text style={styles.myStatValue}>{rows[myIndex].win_rate ?? 0}%</Text>
            <Text style={styles.myStatLabel}>Rate</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No ranked games yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.rankCol]}>#</Text>
            <Text style={[styles.headerCell, styles.nameCol]}>Player</Text>
            <Text style={[styles.headerCell, styles.ptsCol]}>Pts</Text>
            <Text style={[styles.headerCell, styles.winsCol]}>Wins</Text>
            <Text style={[styles.headerCell, styles.rateCol]}>Rate</Text>
          </View>

          {rows.map((r, i) => {
            const isMe = r.user_id === myUserId;
            return (
              <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt, isMe && styles.rowMe]}>
                <Text style={[styles.cell, styles.rankCol, styles.rankText]}>
                  {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}`}
                </Text>
                <View style={[styles.nameCol, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Text style={[styles.cell]} numberOfLines={1}>
                    {r.display_name || 'Unknown'}
                  </Text>
                  {isMe && <Text style={styles.youBadge}>YOU</Text>}
                </View>
                <Text style={[styles.cell, styles.ptsCol, styles.ptsText]}>{r.ranking_points ?? 0}</Text>
                <Text style={[styles.cell, styles.winsCol, styles.winsText]}>{r.wins}</Text>
                <Text style={[styles.cell, styles.rateCol]}>{r.win_rate ?? 0}%</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.accent, fontWeight: '600', fontSize: 15 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.accent, letterSpacing: 1 },
  // My rank banner
  myRankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, padding: 16, borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  myRankMedal: { fontSize: 32 },
  myRankInfo: { flex: 1 },
  myRankName: { fontSize: 12, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.5 },
  myRankPoints: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  myRankStats: { alignItems: 'center' },
  myStatValue: { fontSize: 16, fontWeight: '700', color: COLORS.accent },
  myStatLabel: { fontSize: 10, color: COLORS.textDim },
  // Table
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { color: '#ef4444', fontSize: 15, textAlign: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  scroll: { padding: 16 },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerCell: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  rowMe: {
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', borderRadius: 8,
  },
  cell: { fontSize: 14, color: COLORS.text },
  rankCol: { width: 36 },
  nameCol: { flex: 1 },
  ptsCol: { width: 44, textAlign: 'center' },
  winsCol: { width: 44, textAlign: 'center' },
  rateCol: { width: 48, textAlign: 'right' },
  rankText: { fontWeight: '700', fontSize: 16 },
  ptsText: { color: COLORS.accent, fontWeight: '700' },
  winsText: { color: COLORS.accent, fontWeight: '600' },
  youBadge: {
    fontSize: 9, fontWeight: '800', color: COLORS.accent,
    backgroundColor: 'rgba(212,175,55,0.2)',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
});
