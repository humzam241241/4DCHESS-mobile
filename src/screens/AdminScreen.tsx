import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { COLORS, SERVER_URL } from '../constants';
import { getAuthHeaders } from '../auth';

type Props = { navigate: (screen: 'Lobby') => void };

interface Overview {
  totalUsers: number; lifetimeUsers: number; activeSubscribers: number;
  freeUsers: number; totalGames: number; finishedGames: number;
  activePlaying: number; waitingGames: number;
}

interface AdminUser {
  id: string; display_name: string; email: string;
  is_admin: boolean; has_lifetime_access: boolean;
  subscription_status: string; games_played: number; created_at: string;
}

interface AdminGame {
  id: string; code: string; game_type: string; status: string;
  player_count: number; winner: string | null; turn_number: number; created_at: string;
}

interface Revenue { lifetimeTotal: number; monthlyTotal: number; grossTotal: number; }

export default function AdminScreen({ navigate }: Props) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${SERVER_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...headers, ...(options?.headers || {}) },
    });
    return res.json();
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [ov, u, g, r] = await Promise.all([
        apiFetch('/api/admin/overview'),
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/games'),
        apiFetch('/api/admin/revenue'),
      ]);
      if (ov.error) { Alert.alert('Error', ov.error); return; }
      setOverview(ov);
      if (u.users) setUsers(u.users);
      if (g.games) setGames(g.games);
      if (!r.error) setRevenue(r);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load admin data');
    }
  }, [apiFetch]);

  useEffect(() => {
    (async () => {
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const updateUser = async (userId: string, field: string, value: any) => {
    const data = await apiFetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    });
    if (data.error) { Alert.alert('Error', data.error); return; }
    // Reload users
    const u = await apiFetch('/api/admin/users');
    if (u.users) setUsers(u.users);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const estRevenue = ((overview?.lifetimeUsers ?? 0) * 5) + ((overview?.activeSubscribers ?? 0) * 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate('Lobby')} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Admin</Text>
        <Pressable onPress={onRefresh} style={styles.backBtn}>
          <Text style={styles.backText}>Refresh</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        {/* Overview Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Users" value={overview?.totalUsers ?? 0} color="#7c3aed" sub={`${overview?.freeUsers ?? 0} free`} />
          <StatCard label="Premium" value={overview?.lifetimeUsers ?? 0} color="#22c55e" sub="one-time $5" />
          <StatCard label="Active Subs" value={overview?.activeSubscribers ?? 0} color="#7c3aed" sub="monthly" />
          <StatCard label="Total Games" value={overview?.totalGames ?? 0} color="#3b82f6" sub={`${overview?.finishedGames ?? 0} finished`} />
          <StatCard label="Active Now" value={overview?.activePlaying ?? 0} color="#eab308" sub={`${overview?.waitingGames ?? 0} waiting`} />
          <StatCard label="Est. Revenue" value={`$${estRevenue}`} color="#22c55e" sub="test mode" />
        </View>

        {/* Revenue */}
        {revenue && (
          <>
            <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
            <View style={styles.revenueRow}>
              <RevCard label="Lifetime Sales" value={`$${(revenue.lifetimeTotal / 100).toFixed(2)}`} />
              <RevCard label="Subscription MRR" value={`$${(revenue.monthlyTotal / 100).toFixed(2)}`} />
              <RevCard label="Total (gross)" value={`$${(revenue.grossTotal / 100).toFixed(2)}`} />
            </View>
          </>
        )}

        {/* Users */}
        <Text style={styles.sectionTitle}>Users ({users.length})</Text>
        {users.map(u => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{u.display_name || 'Unknown'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{u.email || 'No email'}</Text>
              <View style={styles.userMeta}>
                <PlanBadge user={u} />
                <Text style={styles.metaText}>{u.games_played ?? 0} games</Text>
                <Text style={styles.metaText}>{fmtDate(u.created_at)}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <ActionBtn
                label={u.has_lifetime_access ? 'Revoke Premium' : 'Grant Premium'}
                variant={u.has_lifetime_access ? 'danger' : 'success'}
                onPress={() => updateUser(u.id, 'has_lifetime_access', !u.has_lifetime_access)}
              />
              <ActionBtn
                label={u.subscription_status === 'active' ? 'Cancel Sub' : 'Activate Sub'}
                variant={u.subscription_status === 'active' ? 'danger' : 'success'}
                onPress={() => updateUser(u.id, 'subscription_status', u.subscription_status === 'active' ? 'cancelled' : 'active')}
              />
              <ActionBtn
                label={u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                variant={u.is_admin ? 'danger' : 'purple'}
                onPress={() => updateUser(u.id, 'is_admin', !u.is_admin)}
              />
            </View>
          </View>
        ))}

        {/* Games */}
        <Text style={styles.sectionTitle}>Recent Games ({games.length})</Text>
        {games.map(g => (
          <View key={g.id} style={styles.gameRow}>
            <Text style={styles.gameCode}>{g.code}</Text>
            <Text style={styles.gameType}>{g.game_type}</Text>
            <StatusBadge status={g.status} />
            <Text style={styles.gameMeta}>{g.player_count}/4</Text>
            <Text style={styles.gameMeta}>{g.winner ? cap(g.winner) : '\u2014'}</Text>
            <Text style={styles.gameMeta}>{g.turn_number}t</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---- Sub-components ----

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function RevCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.revCard}>
      <Text style={styles.revLabel}>{label}</Text>
      <Text style={styles.revValue}>{value}</Text>
    </View>
  );
}

function PlanBadge({ user }: { user: AdminUser }) {
  if (user.is_admin) return <Text style={[styles.badge, styles.badgePurple]}>Admin</Text>;
  if (user.subscription_status === 'active') return <Text style={[styles.badge, styles.badgeGreen]}>Monthly</Text>;
  if (user.has_lifetime_access) return <Text style={[styles.badge, styles.badgePurple]}>Premium</Text>;
  return <Text style={[styles.badge, styles.badgeGray]}>Free</Text>;
}

function StatusBadge({ status }: { status: string }) {
  const style = status === 'playing' ? styles.badgeBlue
    : status === 'waiting' ? styles.badgeYellow
    : styles.badgeGray;
  return <Text style={[styles.badge, style]}>{status}</Text>;
}

function ActionBtn({ label, variant, onPress }: { label: string; variant: 'success' | 'danger' | 'purple'; onPress: () => void }) {
  const bg = variant === 'success' ? 'rgba(34,197,94,0.15)'
    : variant === 'danger' ? 'rgba(239,68,68,0.12)'
    : 'rgba(124,58,237,0.15)';
  const fg = variant === 'success' ? '#22c55e'
    : variant === 'danger' ? '#ef4444'
    : '#7c3aed';
  return (
    <Pressable onPress={onPress} style={[styles.actionBtn, { backgroundColor: bg }]}>
      <Text style={[styles.actionBtnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

// ---- Helpers ----

function fmtDate(iso: string | null) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function cap(str: string) { return str.charAt(0).toUpperCase() + str.slice(1); }

// ---- Styles ----

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  center: { flex: 1, backgroundColor: COLORS.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.accent, fontWeight: '600', fontSize: 15 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.accent, letterSpacing: 1 },
  scroll: { padding: 16 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textDim, textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 20, marginBottom: 10,
  },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, width: '48%' as any, flexGrow: 1, minWidth: 140,
  },
  statLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  statSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  // Revenue
  revenueRow: { flexDirection: 'row', gap: 10 },
  revCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 14,
  },
  revLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  revValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },

  // Users
  userCard: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  userInfo: { marginBottom: 10 },
  userName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  // Badges
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  badgePurple: { backgroundColor: 'rgba(124,58,237,0.2)', color: '#7c3aed' },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  badgeGray: { backgroundColor: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
  badgeBlue: { backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  badgeYellow: { backgroundColor: 'rgba(234,179,8,0.15)', color: '#eab308' },

  // Games
  gameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 12, marginBottom: 6,
  },
  gameCode: { fontWeight: '700', letterSpacing: 1, color: COLORS.accent, width: 60 },
  gameType: { fontSize: 12, color: COLORS.textMuted, width: 60 },
  gameMeta: { fontSize: 12, color: COLORS.textMuted },
});
