import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../socket';
import { useGame } from '../store';
import { COLORS, PLAYER_NAMES, SERVER_URL, BOARD_THEMES, BoardTheme } from '../constants';
import { GameType } from '../types';

type Props = {
  navigate: (screen: 'Lobby' | 'Waiting' | 'Game' | 'Leaderboard' | 'Admin') => void;
  profile?: { is_admin?: boolean; has_lifetime_access?: boolean; subscription_status?: string } | null;
};

interface OpenGame {
  id: string;
  code: string;
  player_count: number;
  status: string;
  game_type?: string;
}

const BOARD_THEME_LABELS: Record<BoardTheme, string> = {
  classic: 'Classic', bw: 'B&W', green: 'Green',
  air: 'Air', water: 'Water', earth: 'Earth', fire: 'Fire',
};

export default function LobbyScreen({ navigate, profile }: Props) {
  const game = useGame();
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<GameType>('classic');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic');

  useEffect(() => {
    AsyncStorage.getItem('chaturaji_name').then(n => { if (n) setName(n); });
    AsyncStorage.getItem('chaturaji_board').then(t => { if (t) setBoardTheme(t as BoardTheme); });
    fetchGames();
  }, []);

  const fetchGames = useCallback(() => {
    fetch(`${SERVER_URL}/api/games`).then(r => r.json()).then(setOpenGames).catch(() => {});
    fetch(`${SERVER_URL}/api/recent`).then(r => r.json()).then(g => {
      setRecentGames(g.filter((x: any) => x.status === 'finished').slice(0, 10));
    }).catch(() => {});
  }, []);

  const saveName = (n: string) => {
    setName(n);
    AsyncStorage.setItem('chaturaji_name', n.trim());
  };

  const saveBoardTheme = (t: BoardTheme) => {
    setBoardTheme(t);
    AsyncStorage.setItem('chaturaji_board', t);
  };

  const createGame = () => {
    const trimmed = name.trim();
    if (!trimmed) return Alert.alert('Enter your name');
    game.setMyName(trimmed);

    getSocket().emit('create-game', { playerName: trimmed, gameType: selectedMode }, (res: any) => {
      if (res.error) return Alert.alert('Error', res.error);
      game.setGameId(res.gameId);
      game.setRoomCode(res.code);
      game.setMyColor(res.color);
      game.setGameType(res.gameType || selectedMode);
      game.setGameState(res.state);
      game.setPlayers(res.players);
      saveSession(res.gameId, res.color, trimmed, res.code, res.gameType || selectedMode);
      navigate('Waiting');
    });
  };

  const joinGame = (code?: string) => {
    const trimmed = name.trim();
    const codeVal = (code || joinCode).trim().toUpperCase();
    if (!trimmed) return Alert.alert('Enter your name');
    if (!codeVal) return Alert.alert('Enter a room code');
    game.setMyName(trimmed);

    getSocket().emit('join-game', { code: codeVal, playerName: trimmed }, (res: any) => {
      if (res.error) return Alert.alert('Error', res.error);
      game.setGameId(res.gameId);
      game.setRoomCode(res.code);
      game.setMyColor(res.color);
      game.setGameType(res.gameType || 'classic');
      game.setGameState(res.state);
      game.setPlayers(res.players);
      saveSession(res.gameId, res.color, trimmed, res.code, res.gameType || 'classic');

      // A game is "in progress" if 4 players are seated OR the game has advanced past
      // turn 1. Enochian starts with phase='move' (no dice), so the phase check used
      // for the classic/2v2 'roll' flow doesn't apply — don't use it as a started signal.
      const hasDicePhase = (res.gameType || 'classic') !== 'enochian';
      const started =
        res.players.length >= 4 ||
        res.state.turnNumber > 1 ||
        (hasDicePhase && res.state.phase !== 'roll');
      navigate(started ? 'Game' : 'Waiting');
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={styles.title}>Chaturaji</Text>
          <Text style={styles.subtitle}>Four Kings Chess — Online Multiplayer</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={saveName}
            placeholder="Enter your name..."
            placeholderTextColor={COLORS.textMuted}
            maxLength={20}
            autoCorrect={false}
          />

          {/* Game Mode Tabs */}
          <Text style={styles.label}>GAME MODE</Text>
          <View style={styles.modeTabs}>
            <Pressable
              onPress={() => setSelectedMode('classic')}
              style={[styles.modeTab, selectedMode === 'classic' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, selectedMode === 'classic' && styles.modeTabTextActive]}>
                Free for All
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedMode('2v2')}
              style={[styles.modeTab, selectedMode === '2v2' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, selectedMode === '2v2' && styles.modeTabTextActive]}>
                2v2 Teams
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedMode('enochian')}
              style={[styles.modeTab, selectedMode === 'enochian' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, selectedMode === 'enochian' && styles.modeTabTextActive]}>
                Enochian
              </Text>
            </Pressable>
          </View>
          {selectedMode === '2v2' && (
            <Text style={styles.modeDesc}>Red+Green vs Yellow+Black — Dice, team elimination</Text>
          )}
          {selectedMode === 'enochian' && (
            <Text style={styles.modeDesc}>Elemental Team Battle — No dice, chess pieces</Text>
          )}

          <Pressable onPress={createGame} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>+ Create Game</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{'\u2625'}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.joinRow}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={joinCode}
              onChangeText={t => setJoinCode(t.toUpperCase())}
              placeholder="Room code"
              placeholderTextColor={COLORS.textMuted}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Pressable onPress={() => joinGame()} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Join</Text>
            </Pressable>
          </View>
        </View>

        {/* Board Theme Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Board Style</Text>
          <View style={styles.themeRow}>
            {(Object.keys(BOARD_THEMES) as BoardTheme[]).map(t => {
              const def = BOARD_THEMES[t];
              return (
                <Pressable
                  key={t}
                  onPress={() => saveBoardTheme(t)}
                  style={[styles.themeOpt, boardTheme === t && styles.themeOptActive]}
                >
                  <View style={styles.themePreview}>
                    {def.quadrants ? (
                      def.quadrants.map((q, i) => (
                        <View key={i} style={[styles.themeSquare, { backgroundColor: q }]} />
                      ))
                    ) : (
                      <>
                        <View style={[styles.themeSquare, { backgroundColor: def.light }]} />
                        <View style={[styles.themeSquare, { backgroundColor: def.dark }]} />
                      </>
                    )}
                  </View>
                  <Text style={[styles.themeLabel, boardTheme === t && styles.themeLabelActive]}>
                    {BOARD_THEME_LABELS[t]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {openGames.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Open Games</Text>
            {openGames.map(g => (
              <Pressable key={g.id} style={styles.gameItem} onPress={() => joinGame(g.code)}>
                <Text style={styles.gameCode}>{g.code}</Text>
                <Text style={styles.gameInfo}>
                  {g.game_type === 'enochian' ? 'Enochian ' : g.game_type === '2v2' ? '2v2 ' : ''}{g.player_count}/4 players
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {recentGames.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Games</Text>
            {recentGames.map((g: any) => (
              <View key={g.id} style={styles.gameItem}>
                <Text style={styles.gameCode}>{g.code}</Text>
                <Text style={styles.gameInfo}>
                  Winner: {g.winner ? PLAYER_NAMES[g.winner as keyof typeof PLAYER_NAMES] : '?'} | {g.turn_number} turns
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomBtns}>
          <Pressable onPress={fetchGames} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Refresh</Text>
          </Pressable>
          <Pressable onPress={() => navigate('Leaderboard')} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Leaderboard</Text>
          </Pressable>
          {profile?.is_admin && (
            <Pressable onPress={() => navigate('Admin')} style={styles.ghostBtn}>
              <Text style={[styles.ghostBtnText, { color: '#7c3aed' }]}>Admin</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

async function saveSession(gameId: string, color: string, name: string, code: string, gameType: string) {
  await AsyncStorage.setItem('chaturaji_session', JSON.stringify({ gameId, myColor: color, myName: name, roomCode: code, gameType }));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { padding: 16, paddingBottom: 40 },
  logo: { alignItems: 'center', marginBottom: 24, marginTop: 60 },
  title: { fontSize: 32, fontWeight: '800', color: '#D4AF37', letterSpacing: 3 },
  subtitle: { color: COLORS.textDim, marginTop: 4, fontSize: 14 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textDim,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  codeInput: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Mode tabs
  modeTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeTab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput,
  },
  modeTabActive: {
    borderColor: COLORS.accent, backgroundColor: 'rgba(212,175,55,0.1)',
  },
  modeTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textDim },
  modeTabTextActive: { color: COLORS.accent },
  modeDesc: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 12 },
  // Board themes
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeOpt: {
    width: 72, alignItems: 'center', paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput,
  },
  themeOptActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(212,175,55,0.1)' },
  themePreview: { flexDirection: 'row', flexWrap: 'wrap', width: 34, marginBottom: 6, gap: 2 },
  themeSquare: { width: 16, height: 16, borderRadius: 2 },
  themeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textDim },
  themeLabelActive: { color: COLORS.accent },
  // Buttons
  primaryBtn: {
    backgroundColor: '#1a1510',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  primaryBtnText: { color: '#D4AF37', fontWeight: '700', fontSize: 16, letterSpacing: 1 },
  secondaryBtn: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  bottomBtns: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText: { color: COLORS.textDim, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: '#D4AF37', fontSize: 18 },
  joinRow: { flexDirection: 'row', gap: 8 },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  gameCode: { fontWeight: '700', letterSpacing: 1, color: COLORS.accent },
  gameInfo: { fontSize: 12, color: COLORS.textDim },
});
