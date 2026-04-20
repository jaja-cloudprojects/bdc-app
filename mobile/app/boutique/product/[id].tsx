import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { api } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius, MaxContentWidth } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, scale } = useResponsive();
  const contentWidth = Math.min(width, MaxContentWidth);
  const sidePadding = scale({ phoneSm: Spacing.base, phone: Spacing.lg, tablet: Spacing['2xl'] });

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.products.byId(id!)).data,
    enabled: !!id,
  });

  return (
    <View style={styles.root}>
      <Header onMenuPress={() => router.back()} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingHorizontal: sidePadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
          ]}
        >
          {!!data?.imageUrl && (
            <Image
              source={{ uri: data.imageUrl }}
              style={[styles.image, { height: scale({ phoneSm: 260, phone: 320, tablet: 480 }) }]}
              contentFit="cover"
            />
          )}
          <Text style={styles.name}>{data?.name}</Text>
          {data?.price !== undefined && (
            <Text style={styles.price}>
              {data.price.toFixed(2)} {data.currency ?? '€'}
            </Text>
          )}
          {!!data?.description && (
            <Text style={styles.description}>{data.description}</Text>
          )}
          <Button
            label="Ajouter au panier"
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.xl }}
            onPress={() => {}}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['3xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: {
    width: '100%',
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
  },
  name: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
  },
  price: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.xl,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  description: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    lineHeight: FontSize.base * 1.6,
  },
});
