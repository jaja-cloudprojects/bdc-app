import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Radius, Spacing } from '@/constants/Layout';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  secure?: boolean;
}

export function Input({ label, error, secure, style, ...rest }: Props) {
  const [showPw, setShowPw] = useState(false);
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, !!error && styles.inputWrapError]}>
        <TextInput
          {...rest}
          secureTextEntry={secure && !showPw}
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, style]}
        />
        {secure && (
          <Pressable
            onPress={() => setShowPw((p) => !p)}
            hitSlop={10}
            style={styles.toggle}
          >
            <EyeIcon on={showPw} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function EyeIcon({ on }: { on: boolean }) {
  if (on) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
          stroke={Colors.textSecondary}
          strokeWidth="1.8"
        />
        <Path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke={Colors.textSecondary}
          strokeWidth="1.8"
        />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3l18 18M10 6.5A10 10 0 0 1 22 12s-1.3 2.6-4 4.7M6.2 6.2C3.9 7.9 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1"
        stroke={Colors.textSecondary}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
  },
  inputWrapError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  toggle: {
    padding: Spacing.xs,
  },
  error: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.error,
  },
});
