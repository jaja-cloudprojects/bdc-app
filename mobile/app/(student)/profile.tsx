import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { StudentPageScaffold } from '@/components/StudentPageScaffold';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <StudentPageScaffold title="Mon profil" subtitle="Gérez vos informations personnelles">
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(user?.firstName ?? 'U').charAt(0)}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </View>
      <Button label="Se déconnecter" variant="outline" fullWidth onPress={logout} style={{ marginTop: Spacing.xl }} />
    </StudentPageScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['3xl'],
    color: Colors.white,
  },
  name: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  email: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
