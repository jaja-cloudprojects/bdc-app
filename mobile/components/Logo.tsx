import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { FontFamily, LetterSpacing } from '@/constants/Typography';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showCollection?: boolean;
}

/**
 * Text-based logo matching the "BEAUTÉ DU CIL / Collection" branding in the
 * mockup header. The serif BEAUTÉ DU CIL is rendered with Playfair Display,
 * the italic "Collection" with Cormorant Garamond.
 */
export function Logo({ size = 'md', color = Colors.textPrimary, showCollection = true }: Props) {
  const sizes = {
    sm: { main: 13, sub: 7, gap: 1 },
    md: { main: 18, sub: 9, gap: 2 },
    lg: { main: 28, sub: 13, gap: 4 },
  }[size];

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.main,
          { fontSize: sizes.main, color },
        ]}
      >
        BEAUTÉ DU CIL
      </Text>
      {showCollection && (
        <Text
          style={[
            styles.sub,
            { fontSize: sizes.sub, color, marginTop: sizes.gap },
          ]}
        >
          C O L L E C T I O N
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    fontFamily: FontFamily.serif,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.sans,
    letterSpacing: LetterSpacing.widest,
    textAlign: 'center',
    opacity: 0.85,
  },
});
