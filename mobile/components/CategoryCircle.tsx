import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing } from '@/constants/Layout';

interface Props {
  label: string;
  imageUrl?: string;
  fallback?: string;
  onPress?: () => void;
  size?: number;
}

export function CategoryCircle({ label, imageUrl, fallback, onPress, size = 82 }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Catégorie ${label}`}
    >
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>{fallback ?? label.charAt(0)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  circle: {
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
  },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
    maxWidth: 100,
  },
});
