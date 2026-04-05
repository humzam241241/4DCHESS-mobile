import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getSocket } from '../socket';
import { useGame } from '../store';
import { COLORS, PLAYERS, PLAYER_NAMES, PLAYER_COLORS } from '../constants';

type Props = { navigate: (screen: 'Lobby' | 'Waiting' | 'Game') => void };

export default function WaitingScreen({ navigate }: Props) {
  const game = useGame();

  useEffect(() => {
    const onPlayerJoined = (data: any) => {
      game.setPlayers(data.players);
    };

    const onGameStarted = (data: any) => {
      game.setGameState(data.state);
      game.setPlayers(data.players);
      navigate('Game');
    };

    getSocket().on('player-joined', onPlayerJoined);
    getSocket().on('game-started', onGameStarted);

    return () => {
      getSocket().off('player-joined', onPlayerJoined);
      getSocket().off('game-started', onGameStarted);
    };
  }, []);

  const copyCode = async () => {
    if (game.roomCode) {
      await Clipboard.setStringAsync(game.roomCode);
      Alert.alert('Copied!', 'Room code copied to clipboard');
    }
  };

  const startWithBots = () => {
    getSocket().emit('start-game', (res: any) => {
      if (res.error) return Alert.alert('Error', res.error);
      game.setPlayers(res.players);
      game.setGameState(res.state);
      navigate('Game');
    });
  };

  const leave = () => {
    game.reset();
    navigate('Lobby');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiting for Players</Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Text style={styles.code}>{game.roomCode}</Text>
        <Pressable onPress={copyCode} style={styles.copyBtn}>
          <Text style={styles.copyText}>Copy</Text>
        </Pressable>
      </View>

      <View style={styles.slotsGrid}>
        {PLAYERS.map(color => {
          const p = game.players.find(pl => pl.color === color);
          return (
            <View key={color} style={[styles.slot, p && styles.slotFilled]}>
              <View style={[styles.colorDot, { backgroundColor: PLAYER_COLORS[color] }]} />
              <Text style={styles.slotColor}>{PLAYER_NAMES[color]}</Text>
              <Text style={p ? styles.slotName : styles.slotEmpty}>
                {p ? `${p.name}${p.color === game.myColor ? ' (You)' : ''}` : 'Waiting...'}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Share the room code with friends. Game starts when 4 players join.
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={startWithBots} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Fill with Bots & Start</Text>
        </Pressable>
        <Pressable onPress={leave} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Leave</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  codeLabel: { color: COLORS.textDim, fontSize: 12, textTransform: 'uppercase' },
  code: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 5,
    color: COLORS.accent,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  copyBtn: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyText: { color: COLORS.textDim, fontWeight: '600', fontSize: 13 },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
    maxWidth: 400,
  },
  slot: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '47%',
    minWidth: 140,
  },
  slotFilled: { borderColor: COLORS.success },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 4 },
  slotColor: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  slotName: { color: COLORS.text, fontWeight: '700', fontSize: 13, marginTop: 2, textAlign: 'center' },
  slotEmpty: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  hint: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
  actions: { gap: 10, alignItems: 'center' },
  secondaryBtn: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  ghostBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  ghostBtnText: { color: COLORS.textDim, fontWeight: '600' },
});
