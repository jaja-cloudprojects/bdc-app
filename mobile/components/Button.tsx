import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/Typography';
import { Radius, Spacing } from '@/constants/Layout';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: Props) {
  const variantStyles = VARIANTS[variant];
  const sizeStyles = SIZES[size];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color as string} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && iconPosition === 'left' && <View>{icon}</View>}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS = {
  primary: {
    container: { backgroundColor: Colors.primary },
    text: { color: Colors.white },
  },
  secondary: {
    container: { backgroundColor: Colors.backgroundCard },
    text: { color: Colors.textPrimary },
  },
  outline: {
    container: {
      backgroundColor: Colors.transparent,
      borderWidth: 1.2,
      borderColor: Colors.textPrimary,
    },
    text: { color: Colors.textPrimary },
  },
  ghost: {
    container: { backgroundColor: Colors.transparent },
    text: { color: Colors.textPrimary },
  },
} as const;

const SIZES = {
  sm: {
    container: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      minHeight: 36,
    },
    text: { fontSize: FontSize.sm },
  },
  md: {
    container: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: 46,
    },
    text: { fontSize: FontSize.md },
  },
  lg: {
    container: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.base,
      minHeight: 56,
    },
    text: { fontSize: FontSize.lg },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: FontFamily.sansSemibold,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
  },
});
