import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../socket';
import { useGame } from '../store';
import { COLORS, PLAYER_NAMES, ENOCHIAN_PLAYER_NAMES, PLAYER_COLORS, BoardTheme } from '../constants';
import { PlayerColor } from '../types';
import Board from '../components/Board';
import DicePanel from '../components/DicePanel';
import PlayersList from '../components/PlayersList';
import MoveHistory from '../components/MoveHistory';
import ChatPanel from '../components/ChatPanel';
import GameOverModal from '../components/GameOverModal';

type Props = {
  navigate: (screen: 'Lobby' | 'Waiting' | 'Game') => void;
  boardTheme?: BoardTheme;
};

export default function GameScreen({ navigate, boardTheme = 'classic' }: Props) {
  const game = useGame();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'moves' | 'chat'>('moves');

  const isEnochian = game.gameType === 'enochian';
  const noDice = isEnochian;
  const nameMap = isEnochian ? ENOCHIAN_PLAYER_NAMES : PLAYER_NAMES;

  useEffect(() => {
    const onDiceRolled = (data: any) => {
      game.setGameState(data.state);
      setSelectedCell(null);
      setValidMoves([]);
      setRolling(true);
      setTimeout(() => setRolling(false), 400);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onMoveMade = (data: any) => {
      game.setGameState(data.state);
      if (data.move) {
        setLastMove({ from: data.move.from, to: data.move.to });
        game.addMove(data.move);
      }
      setSelectedCell(null);
      setValidMoves([]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onTurnSkipped = (data: any) => {
      game.setGameState(data.state);
      setSelectedCell(null);
      setValidMoves([]);
      game.addChat({ color: '', name: 'System', message: `${nameMap[data.player as PlayerColor]} skipped` });
    };

    const onPlayerJoined = (data: any) => {
      game.setPlayers(data.players);
      game.addChat({ color: '', name: 'System', message: `${data.name} joined as ${nameMap[data.color as PlayerColor]}` });
    };

    const onPlayerReconnected = (data: any) => {
      game.addChat({ color: '', name: 'System', message: `${data.name} reconnected` });
    };

    const onPlayerDisconnected = (data: any) => {
      game.addChat({ color: '', name: 'System', message: `${data.name} disconnected` });
    };

    const onGameOver = () => {
      setShowGameOver(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const onChatMessage = (data: any) => {
      game.addChat({ color: data.color, name: data.name, message: data.message });
    };

    const onGameStarted = (data: any) => {
      game.setGameState(data.state);
      game.setPlayers(data.players);
      game.addChat({ color: '', name: 'System', message: 'Game started!' });
    };

    getSocket().on('dice-rolled', onDiceRolled);
    getSocket().on('move-made', onMoveMade);
    getSocket().on('turn-skipped', onTurnSkipped);
    getSocket().on('player-joined', onPlayerJoined);
    getSocket().on('player-reconnected', onPlayerReconnected);
    getSocket().on('player-disconnected', onPlayerDisconnected);
    getSocket().on('game-over', onGameOver);
    getSocket().on('chat-message', onChatMessage);
    getSocket().on('game-started', onGameStarted);

    // Resync state on mount to recover from any events that fired
    // server-side during the Waiting → Game navigation (race fix).
    if (game.gameId && game.myColor && game.myName) {
      getSocket().emit(
        'rejoin-game',
        { gameId: game.gameId, color: game.myColor, playerName: game.myName },
        (res: any) => {
          if (res && !res.error && res.state) {
            game.setGameState(res.state);
            if (res.players) game.setPlayers(res.players);
          }
        }
      );
    }

    return () => {
      getSocket().off('dice-rolled', onDiceRolled);
      getSocket().off('move-made', onMoveMade);
      getSocket().off('turn-skipped', onTurnSkipped);
      getSocket().off('player-joined', onPlayerJoined);
      getSocket().off('player-reconnected', onPlayerReconnected);
      getSocket().off('player-disconnected', onPlayerDisconnected);
      getSocket().off('game-over', onGameOver);
      getSocket().off('chat-message', onChatMessage);
      getSocket().off('game-started', onGameStarted);
    };
  }, []);

  const onCellPress = useCallback((row: number, col: number) => {
    if (!game.gameState || game.gameState.winner || game.gameState.currentPlayer !== game.myColor) return;
    // Classic requires dice; Enochian does not
    if (!noDice && !game.gameState.dice) return;

    if (selectedCell && validMoves.some(m => m.row === row && m.col === col)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      getSocket().emit('make-move', {
        fromRow: selectedCell.row, fromCol: selectedCell.col,
        toRow: row, toCol: col,
      }, (res: any) => {
        if (res.error) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        game.setGameState(res.state);
        if (res.move) {
          setLastMove({ from: res.move.from, to: res.move.to });
          game.addMove(res.move);
          if (res.move.captured) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        setSelectedCell(null);
        setValidMoves([]);
      });
      return;
    }

    const piece = game.gameState.board[row][col];
    if (piece && piece.color === game.myColor) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      getSocket().emit('get-moves', { row, col }, (res: any) => {
        if (res.moves && res.moves.length > 0) {
          setSelectedCell({ row, col });
          setValidMoves(res.moves);
        } else {
          setSelectedCell(null);
          setValidMoves([]);
        }
      });
      return;
    }

    setSelectedCell(null);
    setValidMoves([]);
  }, [game.gameState, game.myColor, selectedCell, validMoves, noDice]);

  const onRoll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Roll-dice with a timeout + one retry. If the server response drops or
    // the socket is mid-reconnect, the previous code would leave the button
    // hanging indefinitely. We now time out after 3s and retry once; if the
    // retry also times out, we show an error and unstick the UI.
    let settled = false;
    const attempt = (isRetry: boolean) => {
      const timer = setTimeout(() => {
        if (settled) return;
        if (!isRetry) {
          attempt(true);
        } else {
          settled = true;
          setRolling(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }, 3000);
      getSocket().emit('roll-dice', (res: any) => {
        if (settled) return;
        clearTimeout(timer);
        settled = true;
        if (res?.error) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setRolling(false);
          return;
        }
        if (res?.state) game.setGameState(res.state);
      });
    };

    setRolling(true);
    setTimeout(() => setRolling(false), 400);
    attempt(false);
  }, []);

  const onSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    getSocket().emit('skip-turn', (res: any) => {
      if (res.error) return;
      game.setGameState(res.state);
      setSelectedCell(null);
      setValidMoves([]);
    });
  }, []);

  const backToLobby = useCallback(() => {
    setShowGameOver(false);
    AsyncStorage.removeItem('chaturaji_session');
    game.reset();
    navigate('Lobby');
  }, [navigate]);

  if (!game.gameState) return null;

  const gs = game.gameState;
  const isMyTurn = gs.currentPlayer === game.myColor;

  return (
    <View style={styles.container}>
      <View style={styles.turnBar}>
        <Text style={[styles.turnText, { color: PLAYER_COLORS[gs.currentPlayer] }]}>
          {gs.winner
            ? `${nameMap[gs.winner]} Wins!`
            : isMyTurn
              ? 'Your Turn!'
              : `${nameMap[gs.currentPlayer]}'s Turn`
          }
        </Text>
        <View style={styles.turnRight}>
          {isEnochian && <Text style={styles.modeBadge}>2v2</Text>}
          <Text style={styles.roomLabel}>Room: <Text style={styles.roomCode}>{game.roomCode}</Text></Text>
        </View>
      </View>

      <Board
        gameState={gs}
        myColor={game.myColor}
        selectedCell={selectedCell}
        validMoves={validMoves}
        lastMove={lastMove}
        onCellPress={onCellPress}
        disabled={!!gs.winner}
        boardTheme={boardTheme}
      />

      <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
        {/* Only show dice panel for classic mode */}
        {!noDice && (
          <View style={styles.panel}>
            <DicePanel
              gameState={gs}
              myColor={game.myColor}
              onRoll={onRoll}
              onSkip={onSkip}
              rolling={rolling}
            />
          </View>
        )}

        {/* For Enochian, show skip turn button inline */}
        {noDice && isMyTurn && !gs.winner && (
          <View style={styles.panel}>
            <Pressable onPress={onSkip} style={styles.skipBtnEnochian}>
              <Text style={styles.skipBtnText}>End Turn</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>PLAYERS</Text>
          <PlayersList
            players={game.players}
            gameState={gs}
            myColor={game.myColor}
            gameType={game.gameType}
          />
        </View>

        <View style={[styles.panel, styles.tabPanel]}>
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('moves')}
              style={[styles.tab, activeTab === 'moves' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'moves' && styles.tabTextActive]}>Moves</Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('chat')}
              style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
            </Pressable>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'moves' ? (
              <MoveHistory moves={game.moveHistory} />
            ) : (
              <ChatPanel messages={game.chatMessages} />
            )}
          </View>
        </View>
      </ScrollView>

      <GameOverModal
        visible={showGameOver}
        winner={gs.winner}
        turnNumber={gs.turnNumber}
        moveCount={game.moveHistory.length}
        onBackToLobby={backToLobby}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  turnBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 56,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  turnText: { fontSize: 16, fontWeight: '700' },
  turnRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeBadge: {
    fontSize: 10, fontWeight: '700', color: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  roomLabel: { color: COLORS.textDim, fontSize: 12 },
  roomCode: { color: COLORS.accent, fontWeight: '700' },
  controlsScroll: { flex: 1, paddingHorizontal: 12, marginTop: 8 },
  panel: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  tabPanel: { height: 260, padding: 0, overflow: 'hidden' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textDim,
    marginBottom: 6,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.accent },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.textDim,
  },
  tabTextActive: { color: COLORS.accent },
  tabContent: { flex: 1, padding: 8 },
  skipBtnEnochian: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});
