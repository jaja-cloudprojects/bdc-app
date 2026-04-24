import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { StudentMenuProvider } from '@/contexts/StudentMenuContext';
import { DrawerMenu } from '@/components/DrawerMenu';
import { Colors } from '@/constants/Colors';
import { InAppBanner } from '@/components/InAppBanner';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';

const menuItems = [
  { label: 'Tableau de bord',  onPress: () => router.push('/(student)/dashboard' as any) },
  { label: 'Mes documents',    onPress: () => router.push('/(student)/documents' as any) },
  { label: 'Mon profil',       onPress: () => router.push('/(student)/profile' as any) },
  { label: 'Masterclasses',    onPress: () => router.push('/(student)/practical-sheets' as any) },
  { label: "Besoin d'aide",    onPress: () => router.push('/(student)/help' as any) },
  { label: 'Chat support',     onPress: () => router.push('/(student)/chat' as any) },
  { label: 'Retour boutique',  onPress: () => router.replace('/') },
];

export default function StudentLayout() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useInAppNotifications((notif) => {
    setBanner(notif);
    setBannerVisible(true);
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.dismissAll();
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const handleLogout = () =>
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
      ],
    );

  return (
    <StudentMenuProvider openMenu={() => setMenuOpen(true)}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'ios_from_right',
          }}
        >
          {/* dashboard : swipe désactivé pour ne pas quitter l'espace élèves */}
          <Stack.Screen name="dashboard" options={{ gestureEnabled: false }} />
          <Stack.Screen name="chat" />
          <Stack.Screen name="documents" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="practical-sheets" />
          <Stack.Screen name="help" />
          <Stack.Screen name="pdf-viewer" />
        </Stack>

        <DrawerMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          logoutItem={{ label: 'Se déconnecter', onPress: handleLogout }}
          onLogoPress={() => router.push('/(student)/dashboard' as any)}
        />

        {banner && (
          <InAppBanner
            title={banner.title}
            body={banner.body}
            visible={bannerVisible}
            onDismiss={() => { setBannerVisible(false); setBanner(null); }}
          />
        )}
      </View>
    </StudentMenuProvider>
  );
}
