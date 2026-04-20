import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Radius, Spacing } from '@/constants/Layout';

interface Props {
  role: 'user' | 'bot' | 'admin';
  content: string;
  senderName: string;
  avatarUrl?: string;
  timestamp?: string;
}

export function ChatBubble({ role, content, senderName, avatarUrl, timestamp }: Props) {
  const isUser = role === 'user';
  return (
    <View
      style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowOther,
      ]}
    >
      {!isUser && <BotAvatar />}
      <View style={[styles.wrap, isUser && styles.wrapUser]}>
        <View style={styles.nameRow}>
          {isUser && (
            <Text style={[styles.name, styles.nameUser]}>{senderName}</Text>
          )}
          {!isUser && (
            <Text style={styles.name}>{senderName}</Text>
          )}
          {isUser && <UserAvatar />}
        </View>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
          ]}
        >
          <Text
            style={[
              styles.content,
              isUser ? styles.contentUser : styles.contentBot,
            ]}
          >
            {content}
          </Text>
        </View>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>
    </View>
  );
}

function UserAvatar() {
  return (
    <View style={styles.avatarUser}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="10" r="3.5" stroke={Colors.white} strokeWidth="1.5" />
        <Path
          d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
          stroke={Colors.white}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function BotAvatar() {
  return (
    <View style={styles.avatarBot}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 4l3 3h6l3-3M6 20l3-3h6l3 3M4 12h4M16 12h4M12 4v16"
          stroke={Colors.white}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  wrap: {
    maxWidth: '80%',
  },
  wrapUser: {
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  name: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  nameUser: {
    color: Colors.textPrimary,
  },
  bubble: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  bubbleUser: {
    backgroundColor: Colors.chatUser,
    borderBottomRightRadius: Radius.sm,
  },
  bubbleBot: {
    backgroundColor: Colors.chatBot,
    borderBottomLeftRadius: Radius.sm,
  },
  content: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.4,
  },
  contentUser: {
    color: Colors.white,
  },
  contentBot: {
    color: Colors.white,
  },
  timestamp: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  avatarUser: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.chatUser,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.chatBot,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
