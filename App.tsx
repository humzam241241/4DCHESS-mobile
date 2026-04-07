import 'react-native-get-random-values';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GameContext, GameStore } from './src/store';
import { GameState, Player, PlayerColor, GameType, MoveRecord, ChatMessage } from './src/types';
import { initSupabase, getSupabase, getAccessToken, fetchProfile } from './src/auth';
import { initSocket, getSocket, disconnectSocket } from './src/socket';
import { COLORS, BoardTheme } from './src/constants';

import SignInScreen from './src/screens/SignInScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import WaitingScreen from './src/screens/WaitingScreen';
import GameScreen from './src/screens/GameScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import AdminScreen from './src/screens/AdminScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';

type Screen = 'Loading' | 'SignIn' | 'Lobby' | 'Waiting' | 'Game' | 'Leaderboard' | 'Admin' | 'Marketplace';

export default function App() {
  const [myColor, setMyColor] = useState<PlayerColor | null>(null);
  const [myColors, setMyColors] = useState<PlayerColor[]>([]);
  const [myName, setMyName] = useState('');
  const [gameId, setGameId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>('classic');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [screen, setScreen] = useState<Screen>('Loading');
  const [profile, setProfile] = useState<any>(null);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic');

  const addMove = useCallback((m: MoveRecord) => setMoveHistory(prev => [...prev, m]), []);
  const addChat = useCallback((c: ChatMessage) => setChatMessages(prev => [...prev, c]), []);

  const reset = useCallback(() => {
    setMyColor(null);
    setMyColors([]);
    setMyName('');
    setGameId(null);
    setRoomCode(null);
    setGameType('classic');
    setGameState(null);
    setPlayers([]);
    setMoveHistory([]);
    setChatMessages([]);
    AsyncStorage.removeItem('chaturaji_session');
  }, []);

  const navigate = useCallback((s: 'Lobby' | 'Waiting' | 'Game' | 'Leaderboard' | 'Admin' | 'Marketplace') => setScreen(s), []);

  const store: GameStore = {
    myColor, myColors, myName, gameId, roomCode, gameType, gameState, players, moveHistory, chatMessages,
    setMyColor, setMyColors, setMyName, setGameId, setRoomCode, setGameType, setGameState, setPlayers,
    addMove, setMoveHistory, addChat, setChatMessages, reset,
  };

  // Load board theme preference on mount
  useEffect(() => {
    AsyncStorage.getItem('chaturaji_board').then(t => { if (t) setBoardTheme(t as BoardTheme); });
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    (async () => {
      try {
        await initSupabase();
        const token = await getAccessToken();

        if (!token) {
          setScreen('SignIn');
          return;
        }

        // User is signed in — load profile and connect socket
        await onAuthenticated(token);
      } catch (e) {
        console.error('Init error:', e);
        setScreen('SignIn');
      }
    })();
  }, []);

  const onAuthenticated = async (token?: string) => {
    const jwt = token || await getAccessToken();
    if (!jwt) {
      setScreen('SignIn');
      return;
    }

    // Load profile and pre-fill name
    const prof = await fetchProfile(jwt);
    if (prof) setProfile(prof);
    if (prof?.display_name) {
      setMyName(prof.display_name);
      await AsyncStorage.setItem('chaturaji_name', prof.display_name);
    }

    // Connect socket with JWT
    const socket = initSocket(jwt);

    // Try to rejoin existing session
    const raw = await AsyncStorage.getItem('chaturaji_session');
    if (raw) {
      const session = JSON.parse(raw);
      socket.emit('rejoin-game', session, (res: any) => {
        if (res.error) {
          AsyncStorage.removeItem('chaturaji_session');
          setScreen('Lobby');
          return;
        }

        setGameId(session.gameId);
        setMyColor(session.myColor);
        setMyName(session.myName);
        setRoomCode(session.roomCode);
        setGameType(session.gameType || 'classic');
        setGameState(res.state);
        setPlayers(res.players);

        if (res.moves) {
          const restored: MoveRecord[] = res.moves.map((m: any) => ({
            turn: m.turn_number,
            player: m.player_color,
            piece: m.piece_type,
            from: { row: m.from_row, col: m.from_col, notation: `${String.fromCharCode(97 + m.from_col)}${8 - m.from_row}` },
            to: { row: m.to_row, col: m.to_col, notation: `${String.fromCharCode(97 + m.to_col)}${8 - m.to_row}` },
            captured: m.captured_type ? { type: m.captured_type, color: m.captured_color } : null,
            dice: [m.dice_1, m.dice_2],
          }));
          setMoveHistory(restored);
        }

        if (res.chat) {
          setChatMessages(res.chat.map((c: any) => ({
            color: c.player_color,
            name: c.player_name,
            message: c.message,
          })));
        }

        setScreen('Game');
      });
    } else {
      setScreen('Lobby');
    }
  };

  const onSignedIn = async () => {
    setScreen('Loading');
    await onAuthenticated();
  };

  if (screen === 'Loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (screen === 'SignIn') {
    return (
      <>
        <SignInScreen onSignedIn={onSignedIn} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <GameContext.Provider value={store}>
      <View style={styles.container}>
        {screen === 'Lobby' && <LobbyScreen navigate={navigate} profile={profile} />}
        {screen === 'Waiting' && <WaitingScreen navigate={navigate} />}
        {screen === 'Game' && <GameScreen navigate={navigate} boardTheme={boardTheme} />}
        {screen === 'Leaderboard' && <LeaderboardScreen navigate={navigate} />}
        {screen === 'Admin' && <AdminScreen navigate={navigate} />}
        {screen === 'Marketplace' && <MarketplaceScreen navigate={navigate} />}
        <StatusBar style="light" />
      </View>
    </GameContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  loading: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' },
});
