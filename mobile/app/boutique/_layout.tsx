import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function BoutiqueLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'ios_from_right',
      }}
    />
  );
}
