import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/Typography';
import { Radius, Spacing, Elevation } from '@/constants/Layout';

interface Props {
  name: string;
  subtitle?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  onPress?: () => void;
  width?: number;
  height?: number;
}

export function ProductCard({
  name,
  subtitle,
  imageUrl,
  price,
  currency = '€',
  onPress,
  width,
  height = 200,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { width, height },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {price !== undefined && (
          <Text style={styles.price}>
            {price.toFixed(2)} {currency}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
    ...Elevation.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  placeholder: {
    backgroundColor: Colors.backgroundCard,
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.base,
    gap: 2,
  },
  name: {
    fontFamily: FontFamily.serifItalic,
    fontSize: FontSize.lg,
    color: Colors.white,
    letterSpacing: LetterSpacing.tight,
  },
  subtitle: {
    fontFamily: FontFamily.serifItalic,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  price: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.md,
    color: Colors.white,
    marginTop: Spacing.xs,
  },
});
