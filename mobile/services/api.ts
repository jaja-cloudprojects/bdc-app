import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * Base URL resolution:
 *  - In production: app.json `extra.apiUrl` or EXPO_PUBLIC_API_URL
 *  - In dev: EXPO_PUBLIC_API_URL or extra.apiUrlDev fallback
 */
const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  if (__DEV__) return extra.apiUrlDev ?? 'http://localhost:4000';
  return extra.apiUrl ?? 'https://api.beauteducil.com';
};

export const API_URL = getApiUrl();

const TOKEN_KEY = 'bdc_auth_token';
const REFRESH_KEY = 'bdc_refresh_token';

export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getRefresh(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  async setRefresh(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL + '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Auth token injection
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 auto-refresh
let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            } else {
              reject(error);
            }
          });
        });
      }
      isRefreshing = true;
      try {
        const refresh = await tokenStorage.getRefresh();
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken: refresh,
        });
        await tokenStorage.set(data.token);
        if (data.refreshToken) await tokenStorage.setRefresh(data.refreshToken);
        pendingRequests.forEach((cb) => cb(data.token));
        pendingRequests = [];
        original.headers.Authorization = `Bearer ${data.token}`;
        return apiClient(original);
      } catch (e) {
        pendingRequests.forEach((cb) => cb(null));
        pendingRequests = [];
        await tokenStorage.clear();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Typed API surface
// ============================================================================

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  imageUrl: string;
  gallery?: string[];
  description?: string;
  isNew?: boolean;
  inStock: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  description?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  publishedAt: string;
  body?: string;
}

export interface Masterclass {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  location?: string;
  description?: string;
  spotsAvailable: number;
}

export interface MyReservation {
  id: string;
  status: string;
  createdAt: string;
  masterclass: {
    id: string;
    title: string;
    date: string;
    endDate?: string;
    location?: string;
    spotsAvailable: number;
  };
}

export interface StudentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: 'STUDENT' | 'FORMATRICE' | 'ADMIN';
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'USER' | 'BOT' | 'ADMIN';
  content: string;
  attachments?: { type: 'image' | 'file'; url: string }[];
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

// ============================================================================
// API methods
// ============================================================================

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post<{ token: string; refreshToken: string; user: StudentUser }>(
        '/auth/login',
        { email, password }
      ),
    me: () => apiClient.get<StudentUser>('/auth/me'),
    logout: () => apiClient.post('/auth/logout'),
    registerPushToken: (token: string, platform: 'ios' | 'android') =>
      apiClient.post('/auth/push-token', { token, platform }),
  },
  products: {
    list: (category?: string) =>
      apiClient.get<Product[]>('/products', { params: { category } }),
    newest: () => apiClient.get<Product[]>('/products/newest'),
    byId: (id: string) => apiClient.get<Product>(`/products/${id}`),
  },
  categories: {
    list: () => apiClient.get<Category[]>('/categories'),
  },
  news: {
    list: () => apiClient.get<NewsItem[]>('/news'),
    latest: () => apiClient.get<NewsItem[]>('/news/latest'),
  },
  masterclass: {
    upcoming: () => apiClient.get<Masterclass[]>('/masterclass/upcoming'),
    reserve: (masterclassId: string) =>
      apiClient.post(`/masterclass/${masterclassId}/reserve`),
    cancelReservation: (masterclassId: string) =>
      apiClient.delete(`/masterclass/${masterclassId}/reserve`),
    myReservations: () => apiClient.get<MyReservation[]>('/masterclass/my-reservations'),
  },
  documents: {
    list: () => apiClient.get<Document[]>('/documents'),
  },
  notifications: {
    list: (since?: string) =>
      apiClient.get<InAppNotification[]>('/notifications', { params: since ? { since } : undefined }),
  },
  chat: {
    history: (conversationId?: string) =>
      apiClient.get<ChatMessage[]>('/chat/messages', {
        params: { conversationId },
      }),
    send: (content: string, conversationId?: string) =>
      apiClient.post<ChatMessage>('/chat/messages', { content, conversationId }),
  },
  users: {
    updateProfile: (payload: UpdateProfilePayload) =>
      apiClient.patch<StudentUser>('/auth/me', payload),
    uploadAvatar: (uri: string, mimeType: string) => {
      const form = new FormData();
      form.append('avatar', { uri, type: mimeType, name: 'avatar.jpg' } as any);
      return apiClient.post<{ avatarUrl: string }>('/auth/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
};

export function isApiError(
  error: unknown
): error is AxiosError<{ message: string; code?: string }> {
  return axios.isAxiosError(error);
}
