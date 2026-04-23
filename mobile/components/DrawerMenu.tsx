import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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
  logoutItem?: MenuItem;
  bottomItem?: MenuItem;
  onLogoPress?: () => void;
}

// Duration must match the close animation below
const CLOSE_DURATION = 240;

export function DrawerMenu({ visible, onClose, items, logoutItem, bottomItem, onLogoPress }: Props) {
  const { width } = useResponsive();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(width * 0.82, 360);

  // modalVisible stays true during the close animation so the Modal
  // doesn't vanish before the slide-out finishes.
  const [modalVisible, setModalVisible] = useState(visible);

  const translateX = useSharedValue(-drawerWidth);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateX.value = withTiming(0, {
        duration: 320,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      overlayOpacity.value = withTiming(1, { duration: 320 });
    } else {
      translateX.value = withTiming(-drawerWidth, {
        duration: CLOSE_DURATION,
        easing: Easing.bezier(0.55, 0, 1, 0.45),
      });
      overlayOpacity.value = withTiming(0, { duration: CLOSE_DURATION });
      // Hide the Modal only after the slide-out animation completes
      const t = setTimeout(() => setModalVisible(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
  }, [visible, drawerWidth, translateX, overlayOpacity]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // Wait for the close animation to finish before navigating so the
  // stack push animation plays cleanly without competing with the modal.
  const handleItemPress = (item: MenuItem) => {
    onClose();
    setTimeout(() => item.onPress(), CLOSE_DURATION + 20);
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { width: drawerWidth }, drawerStyle]}>
        <View style={[
          styles.drawerInner,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg },
        ]}>
          <Pressable onPress={onLogoPress} style={styles.logoWrap}>
            <Logo size="md" />
          </Pressable>

          <View style={styles.itemsList}>
            {items.map((item, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() => handleItemPress(item)}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {bottomItem && (
            <Pressable
              style={({ pressed }) => [styles.bottomItem, pressed && styles.itemPressed]}
              onPress={() => handleItemPress(bottomItem)}
            >
              <AvatarIcon />
              <Text style={styles.bottomItemText}>{bottomItem.label}</Text>
            </Pressable>
          )}

          {logoutItem && (
            <Pressable
              style={({ pressed }) => [styles.logoutItem, pressed && styles.itemPressed]}
              onPress={() => handleItemPress(logoutItem)}
            >
              <Text style={styles.logoutText}>{logoutItem.label}</Text>
            </Pressable>
          )}
        </View>
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
  },
  logoWrap: {
    alignItems: 'flex-start',
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
  logoutItem: {
    paddingVertical: Spacing.base,
    marginTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  logoutText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.tight,
  },
});
