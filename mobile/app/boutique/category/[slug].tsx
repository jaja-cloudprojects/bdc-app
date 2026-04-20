import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, MaxContentWidth } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width, scale, columns } = useResponsive();
  const nCols = columns({ min: 2 });
  const contentWidth = Math.min(width, MaxContentWidth);
  const sidePadding = scale({ phoneSm: Spacing.base, phone: Spacing.lg, tablet: Spacing['2xl'] });
  const gap = Spacing.md;
  const cardWidth = (contentWidth - sidePadding * 2 - gap * (nCols - 1)) / nCols;

  const { data } = useQuery({
    queryKey: ['products', 'cat', slug],
    queryFn: async () => (await api.products.list(slug)).data,
    enabled: !!slug,
    placeholderData: [],
  });

  return (
    <View style={styles.root}>
      <Header onMenuPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: sidePadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        <Text style={styles.title}>{slug?.replace(/-/g, ' ')}</Text>
        <View style={[styles.grid, { gap }]}>
          {(data ?? []).map((p: any) => (
            <ProductCard
              key={p.id}
              name={p.name}
              imageUrl={p.imageUrl}
              price={p.price}
              width={cardWidth}
              height={cardWidth * 1.2}
              onPress={() => router.push(`/boutique/product/${p.id}` as any)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['3xl'] },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginVertical: Spacing.lg,
    textTransform: 'capitalize',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
