import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { COLORS, SERVER_URL } from '../constants';
import { getAuthHeaders } from '../auth';

type Props = { navigate: (screen: 'Lobby' | 'Marketplace') => void };

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  item_type: string;
  preview_url: string | null;
  price: number;
  downloads: number;
  rating: number;
  status: string;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  board_theme: 'Board Theme',
  piece_skin: 'Piece Skin',
  board_set: 'Board Set',
};

const SORT_OPTIONS = [
  { key: 'created_at', label: 'Newest' },
  { key: 'popular', label: 'Popular' },
  { key: 'rating', label: 'Top Rated' },
];

export default function MarketplaceScreen({ navigate }: Props) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('created_at');
  const [filter, setFilter] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${SERVER_URL}/api/marketplace?sort=${sort}`;
      if (filter) url += `&type=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load');
      setItems(await res.json());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sort, filter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const purchaseItem = async (itemId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SERVER_URL}/api/marketplace/${itemId}/purchase`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) return;
      loadItems();
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate('Lobby')} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Marketplace</Text>
        <Pressable onPress={loadItems} style={styles.backBtn}>
          <Text style={styles.backText}>Refresh</Text>
        </Pressable>
      </View>

      {/* Sort & Filter */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setSort(opt.key)}
              style={[styles.filterChip, sort === opt.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, sort === opt.key && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <View style={styles.filterDivider} />
          <Pressable
            onPress={() => setFilter(null)}
            style={[styles.filterChip, !filter && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, !filter && styles.filterChipTextActive]}>All</Text>
          </Pressable>
          {Object.entries(ITEM_TYPE_LABELS).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filterChip, filter === key && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No items yet. Be the first to share!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {items.map(item => (
            <View key={item.id} style={styles.card}>
              {item.preview_url && (
                <Image source={{ uri: item.preview_url }} style={styles.preview} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemType}>{ITEM_TYPE_LABELS[item.item_type] || item.item_type}</Text>
                {item.description && (
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={styles.itemMeta}>
                  <Text style={styles.metaText}>{item.downloads} downloads</Text>
                  <Text style={styles.metaText}>
                    {item.rating > 0 ? `${item.rating.toFixed(1)} stars` : 'No ratings'}
                  </Text>
                </View>
                <View style={styles.itemFooter}>
                  <Text style={styles.creator}>
                    by {item.profiles?.display_name || 'Unknown'}
                  </Text>
                  <Pressable onPress={() => purchaseItem(item.id)} style={styles.getBtn}>
                    <Text style={styles.getBtnText}>
                      {item.price > 0 ? `${item.price} pts` : 'Free'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.accent, fontWeight: '600', fontSize: 15 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.accent, letterSpacing: 1 },
  // Filter bar
  filterBar: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterScroll: { paddingHorizontal: 12, gap: 6 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput,
  },
  filterChipActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(212,175,55,0.1)' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textDim },
  filterChipTextActive: { color: COLORS.accent },
  filterDivider: { width: 1, height: 24, backgroundColor: COLORS.border, marginHorizontal: 4 },
  // Content
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center' },
  grid: { padding: 12, gap: 12 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  preview: { width: '100%', height: 160, backgroundColor: COLORS.bgInput },
  cardBody: { padding: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  itemType: { fontSize: 11, fontWeight: '600', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  itemDesc: { fontSize: 13, color: COLORS.textDim, marginBottom: 8, lineHeight: 18 },
  itemMeta: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creator: { fontSize: 12, color: COLORS.textDim },
  getBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
  },
  getBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
