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

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?w=1200';
const FALLBACK_CATEGORIES = [
  { slug: 'extensions-cils', name: 'Extensions de cils', imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400' },
  { slug: 'lash-brow-lift', name: 'Lash brow lift', imageUrl: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400' },
  { slug: 'liquides', name: 'Les liquides', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' },
];
const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Shampoing Chantilly', subtitle: '', imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', price: 19.9 },
  { id: '2', name: 'Volume Classique', subtitle: 'Burgundy', imageUrl: 'https://images.unsplash.com/photo-1599733589046-8a35ed0c6b8d?w=400', price: 29.9 },
  { id: '3', name: 'Bouteille Pro', subtitle: '', imageUrl: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400', price: 24.0 },
];

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { width, scale, isTablet, isTabletLg } = useResponsive();

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
            source={{ uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200' }}
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
        bottomItem={{ label: 'Espace élèves', onPress: () => router.push('/(auth)/login' as any) }}
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
