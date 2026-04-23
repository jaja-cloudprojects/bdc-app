import React, { useEffect, useRef } from 'react';
import { Animated, Text, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius, Elevation } from '@/constants/Layout';

interface Props {
  title: string;
  body: string;
  visible: boolean;
  onDismiss: () => void;
}

const BANNER_HEIGHT = 80;
const AUTO_DISMISS_MS = 4500;

export function InAppBanner({ title, body, visible, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top + 20))).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: insets.top + Spacing.md,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }).start();
      dismissTimer.current = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    } else {
      handleDismiss();
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [visible]);

  const handleDismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(translateY, {
      toValue: -(BANNER_HEIGHT + insets.top + 20),
      duration: 280,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  return (
    <Animated.View
      style={[
        styles.banner,
        Elevation.lg,
        { transform: [{ translateY }] },
      ]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <Pressable onPress={handleDismiss} style={styles.inner}>
        <View style={styles.accent} />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.body} numberOfLines={2}>{body}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 9999,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: BANNER_HEIGHT,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  title: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * 1.45,
  },
});
