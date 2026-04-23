import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { InAppBanner } from '@/components/InAppBanner';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';

export default function StudentLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useInAppNotifications((notif) => {
    setBanner(notif);
    setBannerVisible(true);
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'ios_from_right',
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="practical-sheets" />
        <Stack.Screen name="help" />
        <Stack.Screen name="pdf-viewer" />
      </Stack>

      {banner && (
        <InAppBanner
          title={banner.title}
          body={banner.body}
          visible={bannerVisible}
          onDismiss={() => {
            setBannerVisible(false);
            setBanner(null);
          }}
        />
      )}
    </View>
  );
}
