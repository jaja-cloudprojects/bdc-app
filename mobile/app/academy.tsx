import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';

import { Header } from '@/components/Header';
import { DrawerMenu } from '@/components/DrawerMenu';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/Typography';
import { Spacing, Radius, MaxContentWidth } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';

const COLLAGE_IMAGES = [
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'https://images.unsplash.com/photo-1571646034647-52e6ea84b28c?w=400',
];

const PARTNER_LOGOS = ['FIFPL', 'OPCO EP', 'Qualiopi', 'France Travail', 'AFCEA'];

export default function AcademyScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scale, width, columns } = useResponsive();

  const contentWidth = Math.min(width, MaxContentWidth);
  const sidePadding = scale({ phoneSm: Spacing.base, phone: Spacing.lg, tablet: Spacing['2xl'] });

  const menuItems = [
    { label: 'Accueil', onPress: () => router.push('/') },
    { label: 'Boutique', onPress: () => router.push('/') },
    { label: 'Espace élèves', onPress: () => router.push('/(auth)/login' as any) },
  ];

  const formations = [
    { label: 'FORMATIONS CILS', onPress: () => Linking.openURL('https://beauteducil.com/formations/cils') },
    { label: 'FORMATIONS SOURCILS', onPress: () => Linking.openURL('https://beauteducil.com/formations/sourcils') },
    { label: 'FORMATIONS SKIN', onPress: () => Linking.openURL('https://beauteducil.com/formations/skin') },
    { label: 'MASTERCLASSES', onPress: () => Linking.openURL('https://beauteducil.com/masterclasses') },
  ];

  return (
    <View style={styles.root}>
      <Header
        onMenuPress={() => setMenuOpen(true)}
        showCart={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: sidePadding, maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* BDC Monogram */}
        <View style={styles.logoBlock}>
          <BdcMonogram size={scale({ phoneSm: 70, phone: 80, tablet: 110 })} />
          <Text
            style={[
              styles.brandTitle,
              { fontSize: scale({ phoneSm: 28, phone: 32, tablet: 44 }) },
            ]}
          >
            Beauté du Cil
          </Text>
          <Text
            style={[
              styles.brandSub,
              { fontSize: scale({ phoneSm: 26, phone: 30, tablet: 42 }) },
            ]}
          >
            Academy
          </Text>
          <Text style={styles.tagline}>
            CENTRE DE FORMATION ESTHÉTIQUE N°1 À TOULOUSE
          </Text>
          <Text style={styles.taglineSmall}>
            EXTENSIONS DE CILS · LASH LIFT & BROW LIFT · STRASS DENTAIRE
          </Text>
        </View>

        {/* Polaroid collage */}
        <View style={styles.collageBlock}>
          {COLLAGE_IMAGES.map((url, i) => {
            const rotations = [-8, 5, -3, 8, -6];
            return (
              <Image
                key={url}
                source={{ uri: url }}
                style={[
                  styles.polaroid,
                  {
                    transform: [{ rotate: `${rotations[i] ?? 0}deg` }],
                    marginLeft: i === 0 ? 0 : -30,
                    zIndex: i,
                  },
                ]}
                contentFit="cover"
              />
            );
          })}
        </View>

        {/* Formation buttons grid */}
        <View style={styles.formationsGrid}>
          {formations.map((f, i) => (
            <Pressable
              key={f.label}
              onPress={f.onPress}
              style={({ pressed }) => [
                styles.formationBtn,
                { width: scale({ phoneSm: '48%' as any, phone: '48%' as any, tablet: '23%' as any }) },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.formationBtnText}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Primary CTA */}
        <Button
          label="DÉCOUVRIR LES FORMATIONS"
          variant="outline"
          fullWidth
          size="md"
          style={styles.discoverBtn}
          onPress={() => Linking.openURL('https://beauteducil.com/formations')}
        />

        {/* Partner logos */}
        <View style={styles.partners}>
          {PARTNER_LOGOS.map((label) => (
            <View key={label} style={styles.partnerPill}>
              <Text style={styles.partnerText}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <DrawerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        bottomItem={{ label: 'Espace élèves', onPress: () => router.push('/(auth)/login' as any) }}
      />
    </View>
  );
}

function BdcMonogram({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110">
      <Path
        d="M50 8a42 42 0 0 0-42 42v10a42 42 0 0 0 84 0V50A42 42 0 0 0 50 8Z"
        stroke={Colors.textPrimary}
        strokeWidth="1.2"
        fill="none"
      />
      <Path
        d="M30 45v30h18c8 0 14-6 14-14s-6-14-14-14h-18Zm18 0c8 0 14-6 14-14s-6-14-14-14"
        stroke={Colors.textPrimary}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M50 62c-4 0-8 2-8 8s4 8 8 8c3 0 6-1 8-3"
        stroke={Colors.textPrimary}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingVertical: Spacing.base, paddingBottom: Spacing['3xl'] },
  logoBlock: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  brandTitle: {
    fontFamily: FontFamily.sansSemibold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    letterSpacing: LetterSpacing.tight,
  },
  brandSub: {
    fontFamily: FontFamily.script,
    color: Colors.textPrimary,
    marginTop: -Spacing.xs,
  },
  tagline: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.wider,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  taglineSmall: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
    marginTop: 2,
  },
  collageBlock: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.xl,
    height: 160,
    alignItems: 'center',
  },
  polaroid: {
    width: 90,
    height: 110,
    backgroundColor: Colors.white,
    padding: 4,
    borderRadius: Radius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  formationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  formationBtn: {
    backgroundColor: Colors.tileTeal,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  formationBtnText: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.sm,
    color: Colors.white,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
  },
  discoverBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.tileTeal + 'B3',
    borderWidth: 0,
  },
  partners: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing['2xl'],
  },
  partnerPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  partnerText: {
    fontFamily: FontFamily.sansBold,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.wide,
  },
});
