import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Header } from '@/components/Header';
import { ChatBubble } from '@/components/ChatBubble';
import { useAuth } from '@/contexts/AuthContext';
import { api, ChatMessage } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

const CLEAR_KEY = 'chat_cleared_at';

const FALLBACK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    conversationId: 'c1',
    role: 'USER',
    content:
      "Bonjour, j'ai une question. Sur certaines clientes, les extensions se collent entre elles après la pose, surtout sur le coin externe. Je ne comprends pas d'où ça vient.",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: '2',
    conversationId: 'c1',
    role: 'BOT',
    content:
      "Bonjour. Ce que tu décris ressemble à un problème d'isolation ou de séchage de la colle. Est-ce que tu travailles œil fermé en continu ou tu reviens vérifier après quelques secondes ?",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: '3',
    conversationId: 'c1',
    role: 'USER',
    content: 'Je fais toute la ligne et je vérifie à la fin seulement',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '4',
    conversationId: 'c1',
    role: 'BOT',
    content:
      "D'accord, c'est probablement la cause. La colle peut rester légèrement humide et créer des points de collage entre les cils voisins. Essaie de vérifier régulièrement pendant la pose, surtout sur les zones denses comme le coin externe.",
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
];

export default function ChatScreen() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [clearedAt, setClearedAt] = useState(0);
  const listRef = useRef<FlatList>(null);
  const qc = useQueryClient();

  useEffect(() => {
    AsyncStorage.getItem(CLEAR_KEY).then((val) => {
      if (val) setClearedAt(parseInt(val, 10));
    });
  }, []);

  const { data: messages } = useQuery({
    queryKey: ['chat', 'messages'],
    queryFn: async () => (await api.chat.history()).data,
    placeholderData: FALLBACK_MESSAGES,
    refetchInterval: 2_000,
  });

  const visibleMessages = (messages ?? FALLBACK_MESSAGES).filter(
    (m) => new Date(m.createdAt).getTime() > clearedAt,
  );

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [visibleMessages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      setInput('');
      qc.setQueryData<ChatMessage[]>(['chat', 'messages'], (old = []) => [
        ...old,
        {
          id: `tmp-${Date.now()}`,
          conversationId: 'c1',
          role: 'USER',
          content: text,
          createdAt: new Date().toISOString(),
        },
      ]);
      await api.chat.send(text);
      qc.invalidateQueries({ queryKey: ['chat', 'messages'] });
    } catch {
      qc.invalidateQueries({ queryKey: ['chat', 'messages'] });
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Vider le chat',
      "Masquer tous les messages actuels sur votre appli ? La discussion reste visible depuis le dashboard.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            const ts = Date.now();
            await AsyncStorage.setItem(CLEAR_KEY, String(ts));
            setClearedAt(ts);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <Header
        onMenuPress={() => router.back()}
        showCart={false}
        rightAction={
          <Pressable
            onPress={handleClear}
            hitSlop={12}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.5 }]}
            accessibilityLabel="Vider le chat"
          >
            <IconTrash />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <FlatList
          ref={listRef}
          data={visibleMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <ChatBubble
              role={item.role === 'BOT' || item.role === 'ADMIN' ? 'bot' : 'user'}
              senderName={
                item.role === 'BOT'
                  ? 'BDC Bot'
                  : item.role === 'ADMIN'
                  ? 'BDC Support'
                  : user?.firstName ?? 'Chloé'
              }
              content={item.content}
              timestamp={format(new Date(item.createdAt), 'HH:mm')}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Aucun message. Commencez la conversation !</Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <SafeAreaView edges={['bottom']} style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <View style={styles.inputTools}>
              <Pressable hitSlop={8} style={styles.toolBtn}>
                <IconImage />
              </Pressable>
              <Pressable hitSlop={8} style={styles.toolBtn}>
                <IconCode />
              </Pressable>
              <Pressable hitSlop={8} style={styles.toolBtn}>
                <IconMic />
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Écrire un message..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                pressed && { opacity: 0.85 },
                (!input.trim() || sending) && { opacity: 0.4 },
              ]}
            >
              <IconSend />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function IconTrash() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={Colors.textMuted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={Colors.textMuted} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function IconImage() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"
        stroke={Colors.textSecondary}
        strokeWidth="1.6"
      />
      <Circle cx="9" cy="9" r="2" stroke={Colors.textSecondary} strokeWidth="1.6" />
      <Path d="M21 17l-5-5-8 8" stroke={Colors.textSecondary} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

function IconCode() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 8l-4 4 4 4M16 8l4 4-4 4"
        stroke={Colors.textSecondary}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconMic() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        stroke={Colors.textSecondary}
        strokeWidth="1.6"
      />
      <Path
        d="M5 12a7 7 0 0 0 14 0M12 19v3"
        stroke={Colors.textSecondary}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconSend() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v18M5 10l7-7 7 7"
        stroke={Colors.textPrimary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  clearBtn: {
    padding: 6,
    borderRadius: 8,
  },
  listContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  inputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  inputWrap: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  inputTools: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  toolBtn: {
    padding: 4,
  },
  input: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    maxHeight: 120,
    minHeight: 24,
    paddingVertical: 0,
  },
  sendBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
