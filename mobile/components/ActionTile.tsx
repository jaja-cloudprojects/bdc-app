import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Radius, Spacing, Elevation } from '@/constants/Layout';

interface Props {
  label: string;
  color: string;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

/**
 * Large colored tile used on the Dashboard (Mes documents, J'ai besoin d'aide, etc.)
 * Ratio ~1.6:1 on phones, adjusts via parent layout.
 */
export function ActionTile({ label, color, onPress, style, icon }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: color },
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 76,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.md,
    color: Colors.textInverse,
    textAlign: 'center',
  },
});
