import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Header } from '@/components/Header';
import { DrawerMenu } from '@/components/DrawerMenu';
import { CategoryCircle } from '@/components/CategoryCircle';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/Typography';
import { Spacing, Radius, MaxContentWidth } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';
import { api } from '@/services/api';
import { Images } from '@/constants/Images';
import { useAuth } from '@/contexts/AuthContext';

const FALLBACK_HERO = Images.heroHome;
const FALLBACK_CATEGORIES = [
  { slug: 'extensions-cils', name: 'Extensions de cils', imageUrl: Images.categories['extensions-cils'] },
  { slug: 'lash-brow-lift', name: 'Lash brow lift', imageUrl: Images.categories['lash-brow-lift'] },
  { slug: 'liquides', name: 'Les liquides', imageUrl: Images.categories.liquides },
];
const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Shampoing Chantilly', subtitle: '', imageUrl: Images.products.shampoing, price: 19.9 },
  { id: '2', name: 'Volume Classique', subtitle: 'Burgundy', imageUrl: Images.products.volume, price: 29.9 },
  { id: '3', name: 'Bouteille Pro', subtitle: '', imageUrl: Images.products.bouteille, price: 24.0 },
];

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { width, scale, isTablet, isTabletLg } = useResponsive();
  const { isAuthenticated } = useAuth();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.categories.list()).data,
    placeholderData: FALLBACK_CATEGORIES as any,
  });

  const { data: newest } = useQuery({
    queryKey: ['products', 'newest'],
    queryFn: async () => (await api.products.newest()).data,
    placeholderData: FALLBACK_PRODUCTS as any,
  });

  const contentWidth = Math.min(width, MaxContentWidth);
  const sidePadding = scale({ phoneSm: Spacing.base, phone: Spacing.lg, tablet: Spacing['2xl'] });
  const heroHeight = scale({ phoneSm: 180, phone: 200, tablet: 300 });
  const categorySize = scale({ phoneSm: 72, phone: 82, tablet: 110 });
  const productCardHeight = scale({ phoneSm: 170, phone: 200, tablet: 260 });

  const menuItems = [
    { label: 'Les nouveautés', onPress: () => router.push('/boutique') },
    { label: 'Extensions de cils', onPress: () => router.push('/boutique/category/extensions-cils' as any) },
    { label: 'Lash & Brow Lift', onPress: () => router.push('/boutique/category/lash-brow-lift' as any) },
    { label: 'Les liquides', onPress: () => router.push('/boutique/category/liquides' as any) },
    { label: 'Accessoires', onPress: () => router.push('/boutique/category/accessoires' as any) },
    { label: 'BDC ACADEMY', onPress: () => router.push('/academy') },
  ];

  return (
    <View style={styles.root}>
      <Header
        onMenuPress={() => setMenuOpen(true)}
        onCartPress={() => router.push('/boutique' as any)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: sidePadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image
            source={{ uri: FALLBACK_HERO }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Categories */}
        <View
          style={[
            styles.categoriesRow,
            { justifyContent: isTablet || isTabletLg ? 'center' : 'space-around', gap: isTablet ? Spacing.xl : Spacing.base },
          ]}
        >
          {(categories ?? FALLBACK_CATEGORIES).map((cat: any) => (
            <CategoryCircle
              key={cat.slug}
              label={cat.name}
              imageUrl={cat.imageUrl}
              size={categorySize}
              onPress={() => router.push(`/boutique/category/${cat.slug}` as any)}
            />
          ))}
        </View>

        {/* Newest section */}
        <Text style={styles.sectionTitle}>Les Nouveautés BDC</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsRow}
        >
          {(newest ?? FALLBACK_PRODUCTS).map((p: any) => {
            const cardWidth = scale({ phoneSm: 140, phone: 160, tablet: 220 });
            return (
              <ProductCard
                key={p.id}
                name={p.name}
                subtitle={p.subtitle}
                imageUrl={p.imageUrl}
                width={cardWidth}
                height={productCardHeight}
                onPress={() => router.push(`/boutique/product/${p.id}` as any)}
              />
            );
          })}
        </ScrollView>

        {/* CTA visit boutique */}
        <Pressable
          style={({ pressed }) => [
            styles.boutiqueCta,
            { height: scale({ phoneSm: 80, phone: 96, tablet: 140 }) },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.push('/boutique' as any)}
        >
          <Image
            source={{ uri: Images.visiterBoutique }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.boutiqueCtaText}>VISITER LA BOUTIQUE</Text>
        </Pressable>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>

      <DrawerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        bottomItem={{
          label: 'Espace élèves',
          onPress: () => router.push(isAuthenticated ? '/(student)/dashboard' : '/(auth)/login' as any),
        }}
        onLogoPress={() => router.push('/')}
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
  hero: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  categoriesRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.serifItalic,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.base,
    letterSpacing: LetterSpacing.tight,
  },
  productsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.base,
  },
  boutiqueCta: {
    marginTop: Spacing.xl,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutiqueCtaText: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.lg,
    color: Colors.white,
    letterSpacing: LetterSpacing.widest,
  },
});
