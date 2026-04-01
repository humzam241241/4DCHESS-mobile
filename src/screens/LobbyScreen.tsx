import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../socket';
import { useGame } from '../store';
import { COLORS, PLAYER_NAMES, SERVER_URL } from '../constants';

type Props = { navigate: (screen: 'Lobby' | 'Waiting' | 'Game') => void };

interface OpenGame {
  id: string;
  code: string;
  player_count: number;
  status: string;
}

export default function LobbyScreen({ navigate }: Props) {
  const game = useGame();
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('chaturaji_name').then(n => { if (n) setName(n); });
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

  const createGame = () => {
    const trimmed = name.trim();
    if (!trimmed) return Alert.alert('Enter your name');
    game.setMyName(trimmed);

    getSocket().emit('create-game', { playerName: trimmed }, (res: any) => {
      if (res.error) return Alert.alert('Error', res.error);
      game.setGameId(res.gameId);
      game.setRoomCode(res.code);
      game.setMyColor(res.color);
      game.setGameState(res.state);
      game.setPlayers(res.players);
      saveSession(res.gameId, res.color, trimmed, res.code);
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
      game.setGameState(res.state);
      game.setPlayers(res.players);
      saveSession(res.gameId, res.color, trimmed, res.code);

      if (res.players.length >= 4 || res.state.phase !== 'roll' || res.state.turnNumber > 1) {
        navigate('Game');
      } else {
        navigate('Waiting');
      }
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

        {openGames.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Open Games</Text>
            {openGames.map(g => (
              <Pressable key={g.id} style={styles.gameItem} onPress={() => joinGame(g.code)}>
                <Text style={styles.gameCode}>{g.code}</Text>
                <Text style={styles.gameInfo}>{g.player_count}/4 players</Text>
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

        <Pressable onPress={fetchGames} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Refresh</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

async function saveSession(gameId: string, color: string, name: string, code: string) {
  await AsyncStorage.setItem('chaturaji_session', JSON.stringify({ gameId, myColor: color, myName: name, roomCode: code }));
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
