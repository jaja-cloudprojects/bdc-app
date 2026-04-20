import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

export default function StudentLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login' as any);
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
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="practical-sheets" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
