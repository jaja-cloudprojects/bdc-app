import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Header } from '@/components/Header';
import { DrawerMenu } from '@/components/DrawerMenu';
import { ActionTile } from '@/components/ActionTile';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/Typography';
import { Spacing, Radius, MaxContentWidth } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const FALLBACK_NEWS = [
  {
    id: '1',
    title: 'LA DEMI-POSE DE CILS',
    subtitle: 'LA RÉVOLUTION BEAUTÉ 2025 ALLIANT LASH LIFT ET EXTENSIONS',
    imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800',
    publishedAt: new Date().toISOString(),
  },
];

const FALLBACK_MASTERCLASS = [
  { id: 'm1', title: 'Masterclass Volume Russe', date: '2026-05-09T10:00:00Z', spotsAvailable: 4 },
  { id: 'm2', title: 'Masterclass Lash Lift', date: '2026-05-13T10:00:00Z', spotsAvailable: 3 },
];

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { width, scale } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: news } = useQuery({
    queryKey: ['news', 'latest'],
    queryFn: async () => (await api.news.latest()).data,
    placeholderData: FALLBACK_NEWS as any,
  });

  const { data: masterclass } = useQuery({
    queryKey: ['masterclass', 'upcoming'],
    queryFn: async () => (await api.masterclass.upcoming()).data,
    placeholderData: FALLBACK_MASTERCLASS as any,
  });

  const contentWidth = Math.min(width, MaxContentWidth);
  const sidePadding = scale({ phoneSm: Spacing.base, phone: Spacing.lg, tablet: Spacing['2xl'] });

  const menuItems = [
    { label: 'Tableau de bord', onPress: () => router.push('/(student)/dashboard' as any) },
    { label: 'Mes documents', onPress: () => router.push('/(student)/documents' as any) },
    { label: 'Mon profil', onPress: () => router.push('/(student)/profile' as any) },
    { label: 'Masterclasses', onPress: () => router.push('/(student)/practical-sheets' as any) },
    { label: 'Besoin d\'aide', onPress: () => router.push('/(student)/help' as any) },
    { label: 'Chat support', onPress: () => router.push('/(student)/chat' as any) },
    { label: 'Retour à la boutique', onPress: () => router.push('/') },
  ];

  return (
    <View style={styles.root}>
      <Header onMenuPress={() => setMenuOpen(true)} onCartPress={() => router.push('/')} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: sidePadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome header */}
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeText}>
            <Text
              style={[
                styles.welcomeScript,
                { fontSize: scale({ phoneSm: 24, phone: 28, tablet: 40 }) },
              ]}
            >
              Bienvenue,
            </Text>
            <Text
              style={[
                styles.welcomeName,
                { fontSize: scale({ phoneSm: 34, phone: 40, tablet: 54 }) },
              ]}
              numberOfLines={1}
            >
              {user?.firstName ?? 'Chloé'}
            </Text>
          </View>
          <Pressable
            style={styles.avatarWrap}
            onPress={() => router.push('/(student)/profile' as any)}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(user?.firstName ?? 'C').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 4 action tiles: 2x2 grid */}
        <View style={styles.tilesGrid}>
          <View style={styles.tilesRow}>
            <ActionTile
              label="Mes documents"
              color={Colors.tilePink}
              onPress={() => router.push('/(student)/documents' as any)}
            />
            <ActionTile
              label="J'ai besoin d'aide"
              color={Colors.tileYellow}
              onPress={() => router.push('/(student)/help' as any)}
            />
          </View>
          <View style={styles.tilesRow}>
            <ActionTile
              label="Gérer mon profil"
              color={Colors.tilePurple}
              onPress={() => router.push('/(student)/profile' as any)}
            />
            <ActionTile
              label="Masterclasses"
              color={Colors.tileTeal}
              onPress={() => router.push('/(student)/practical-sheets' as any)}
            />
          </View>
        </View>

        {/* Latest news */}
        <Text style={styles.sectionTitle}>Dernières actualités</Text>
        {(news ?? FALLBACK_NEWS).slice(0, 3).map((item: any) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.newsCard, pressed && { opacity: 0.85 }]}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.newsImage}
              contentFit="cover"
            />
            <View style={styles.newsTextWrap}>
              <View style={styles.newsHeader}>
                <Text style={styles.newsTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.newsTime}>
                  {format(parseISO(item.publishedAt), 'HH:mm', { locale: fr })}
                </Text>
              </View>
              {!!item.subtitle && (
                <Text style={styles.newsSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              )}
            </View>
          </Pressable>
        ))}

        {/* Upcoming masterclass */}
        <Text style={styles.sectionTitle}>Prochaines Masterclass</Text>
        <View style={styles.masterclassCard}>
          <View style={styles.masterclassList}>
            {(masterclass ?? FALLBACK_MASTERCLASS).map((m: any) => (
              <View key={m.id} style={styles.mcRow}>
                <View style={styles.mcDateBlock}>
                  <Text style={styles.mcDay}>
                    {format(parseISO(m.date), 'd', { locale: fr })}
                  </Text>
                  <Text style={styles.mcMonth}>
                    {format(parseISO(m.date), 'MMM', { locale: fr })}
                  </Text>
                </View>
                <View style={styles.mcBody}>
                  <Text style={styles.mcTitle} numberOfLines={1}>{m.title}</Text>
                  <Text style={styles.mcSpots}>
                    {m.spotsAvailable} places disponibles
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.reserveBtn,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push('/(student)/practical-sheets' as any)}
          >
            <Text style={styles.reserveText}>Réserver{'\n'}un créneau</Text>
          </Pressable>
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      <DrawerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        logoutItem={{ label: 'Déconnexion', onPress: logout }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Spacing['3xl'],
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  welcomeText: { flex: 1 },
  welcomeScript: {
    fontFamily: FontFamily.serifItalic,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.tight,
  },
  welcomeName: {
    fontFamily: FontFamily.serifBold,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.tight,
    lineHeight: undefined,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  avatarInitial: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['2xl'],
    color: Colors.white,
  },
  tilesGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.base,
    marginBottom: Spacing.md,
  },
  newsCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
    marginBottom: Spacing.md,
    height: 76,
  },
  newsImage: {
    width: 100,
    height: '100%',
  },
  newsTextWrap: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    gap: 4,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsTitle: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: LetterSpacing.wide,
  },
  newsTime: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  newsSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * 1.4,
  },
  masterclassCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
  },
  masterclassList: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  mcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mcDateBlock: {
    width: 52,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
  },
  mcDay: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  mcMonth: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  mcBody: { flex: 1 },
  mcTitle: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  mcSpots: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reserveBtn: {
    backgroundColor: Colors.reserveBlue,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  reserveText: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.base,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.3,
  },
});
