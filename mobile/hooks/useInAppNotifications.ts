import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const LAST_SEEN_KEY = 'bdc_last_inapp_notif';
const POLL_INTERVAL_MS = 30_000;

export interface InAppNotifPayload {
  title: string;
  body: string;
}

export function useInAppNotifications(onNew: (n: InAppNotifPayload) => void) {
  const { isAuthenticated } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const check = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const since = await SecureStore.getItemAsync(LAST_SEEN_KEY);
      const { data: items } = await api.notifications.list(since ?? undefined);
      if (items.length > 0) {
        await SecureStore.setItemAsync(LAST_SEEN_KEY, items[0].createdAt);
        onNewRef.current({ title: items[0].title, body: items[0].body });
      }
    } catch {
      // Silent fail — network may be unavailable
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    check();
    timerRef.current = setInterval(check, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [isAuthenticated, check]);
}
