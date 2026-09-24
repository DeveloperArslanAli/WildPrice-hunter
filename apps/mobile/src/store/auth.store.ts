import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/app';

interface User {
  id: string;
  email: string;
  displayName: string;
  plan: 'free' | 'pro';
  dropshippingMode: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, tokens: AuthTokens) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  loadFromStorage: () => Promise<void>;
  toggleDropshippingMode: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, tokens) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user, tokens, isAuthenticated: true });
  },

  clearAuth: async () => {
    await AsyncStorage.removeMany([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  loadFromStorage: async () => {
    try {
      const items = await AsyncStorage.getMany([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);

      const accessToken = items[STORAGE_KEYS.ACCESS_TOKEN];
      const refreshToken = items[STORAGE_KEYS.REFRESH_TOKEN];
      const userJson = items[STORAGE_KEYS.USER];

      if (accessToken && userJson) {
        set({
          tokens: {
            accessToken,
            refreshToken: refreshToken ?? '',
          },
          user: JSON.parse(userJson),
          isAuthenticated: true,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  toggleDropshippingMode: () => {
    const user = get().user;
    if (user) {
      const updated = { ...user, dropshippingMode: !user.dropshippingMode };
      set({ user: updated });
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    }
  },
}));
