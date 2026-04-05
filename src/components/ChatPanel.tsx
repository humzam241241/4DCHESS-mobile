import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Keyboard } from 'react-native';
import { ChatMessage } from '../types';
import { PLAYER_COLORS, COLORS } from '../constants';
import { getSocket } from '../socket';

interface ChatPanelProps {
  messages: ChatMessage[];
}

export default function ChatPanel({ messages }: ChatPanelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    getSocket().emit('chat-message', { message: msg });
    setText('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        {messages.map((m, i) => (
          <View key={i} style={styles.msg}>
            <Text style={[styles.name, m.color ? { color: PLAYER_COLORS[m.color as keyof typeof PLAYER_COLORS] } : null]}>
              {m.name}
            </Text>
            <Text style={styles.text}>{m.message}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Pressable onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 4 },
  msg: { flexDirection: 'row', gap: 4, paddingVertical: 3, flexWrap: 'wrap' },
  name: { fontWeight: '700', fontSize: 13, color: COLORS.text },
  text: { color: COLORS.text, fontSize: 13, flexShrink: 1 },
  inputRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
