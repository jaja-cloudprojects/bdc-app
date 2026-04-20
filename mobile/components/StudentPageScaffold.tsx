import React, { ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, MaxContentWidth } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/**
 * Shared layout for sub-pages of the student area: Documents, Profile, Help, etc.
 */
export function StudentPageScaffold({ title, subtitle, children }: Props) {
  const { width, scale } = useResponsive();
  const contentWidth = Math.min(width, MaxContentWidth);
  const sidePadding = scale({ phoneSm: Spacing.base, phone: Spacing.lg, tablet: Spacing['2xl'] });

  return (
    <View style={styles.root}>
      <Header onMenuPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: sidePadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={{ marginTop: Spacing.lg }}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['3xl'] },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['3xl'],
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
