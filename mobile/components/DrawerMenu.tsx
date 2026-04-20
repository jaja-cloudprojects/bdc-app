import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/Typography';
import { Spacing } from '@/constants/Layout';
import { useResponsive } from '@/hooks/useResponsive';
import { Logo } from './Logo';

export interface MenuItem {
  label: string;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  bottomItem?: MenuItem;
  onLogoPress?: () => void;
}

export function DrawerMenu({ visible, onClose, items, bottomItem, onLogoPress }: Props) {
  const { width } = useResponsive();
  const drawerWidth = Math.min(width * 0.82, 360);

  const translateX = useSharedValue(-drawerWidth);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
      overlayOpacity.value = withTiming(1, { duration: 280 });
    } else {
      translateX.value = withTiming(-drawerWidth, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      overlayOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible, drawerWidth, translateX, overlayOpacity]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleItemPress = (item: MenuItem) => {
    onClose();
    // Delay slightly so menu closes visually first
    setTimeout(() => item.onPress(), 160);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { width: drawerWidth }, drawerStyle]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.drawerInner}>
          <Pressable onPress={onLogoPress} style={styles.logoWrap}>
            <Logo size="md" />
          </Pressable>

          <View style={styles.itemsList}>
            {items.map((item, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.itemPressed,
                ]}
                onPress={() => handleItemPress(item)}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {bottomItem && (
            <Pressable
              style={({ pressed }) => [
                styles.bottomItem,
                pressed && styles.itemPressed,
              ]}
              onPress={() => handleItemPress(bottomItem)}
            >
              <AvatarIcon />
              <Text style={styles.bottomItemText}>{bottomItem.label}</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

function AvatarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" stroke={Colors.textPrimary} strokeWidth="1.5" />
      <Circle cx="12" cy="10" r="3.2" stroke={Colors.textPrimary} strokeWidth="1.5" />
      <Path
        d="M5.5 20c1.6-3 3.8-4.5 6.5-4.5s4.9 1.5 6.5 4.5"
        stroke={Colors.textPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  logoWrap: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.base,
    marginBottom: Spacing.xl,
  },
  itemsList: {
    flex: 1,
  },
  item: {
    paddingVertical: Spacing.base,
  },
  itemPressed: {
    opacity: 0.55,
  },
  itemText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.tight,
  },
  bottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  bottomItemText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
});
