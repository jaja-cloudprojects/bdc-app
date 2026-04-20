import React from 'react';
import { View, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { HeaderHeight, Spacing } from '@/constants/Layout';
import { Logo } from './Logo';

interface Props {
  onMenuPress?: () => void;
  onCartPress?: () => void;
  showCart?: boolean;
  showMenu?: boolean;
  logoSize?: 'sm' | 'md' | 'lg';
}

export function Header({
  onMenuPress,
  onCartPress,
  showCart = true,
  showMenu = true,
  logoSize = 'md',
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={styles.side}>
          {showMenu && (
            <Pressable
              onPress={onMenuPress}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.iconBtnPressed,
              ]}
              hitSlop={12}
              accessibilityLabel="Ouvrir le menu"
              accessibilityRole="button"
            >
              <MenuIcon />
            </Pressable>
          )}
        </View>

        <View style={styles.center}>
          <Logo size={logoSize} />
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {showCart && (
            <Pressable
              onPress={onCartPress}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.iconBtnPressed,
              ]}
              hitSlop={12}
              accessibilityLabel="Ouvrir le panier"
              accessibilityRole="button"
            >
              <CartIcon />
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function MenuIcon() {
  return (
    <Svg width={22} height={16} viewBox="0 0 22 16" fill="none">
      <Line x1="1" y1="1.5" x2="21" y2="1.5" stroke={Colors.textPrimary} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="8" x2="21" y2="8" stroke={Colors.textPrimary} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14.5" x2="21" y2="14.5" stroke={Colors.textPrimary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CartIcon() {
  return (
    <Svg width={24} height={22} viewBox="0 0 24 22" fill="none">
      <Path
        d="M2 2h3l2.5 12.5a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 6H6"
        stroke={Colors.textPrimary}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 20.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0ZM19 20.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z"
        fill={Colors.textPrimary}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: Colors.background,
  },
  container: {
    height: HeaderHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  side: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  iconBtnPressed: {
    opacity: 0.6,
  },
});
