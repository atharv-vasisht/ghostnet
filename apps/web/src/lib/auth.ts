import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens, SignupRequest } from '@ghostnet/shared';
import api, { registerTokenAccessor } from './api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: Omit<SignupRequest, 'email'> & { email: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setDemo: (demo: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      registerTokenAccessor(() => get().accessToken);

      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        isDemo: false,

        login: async (email, password) => {
          set({ isLoading: true });
          try {
            const { data } = await api.post<AuthTokens>('/auth/login', {
              email,
              password,
            });
            set({
              accessToken: data.accessToken,
              isAuthenticated: true,
            });
            await get().fetchMe();
          } finally {
            set({ isLoading: false });
          }
        },

        signup: async (signupData) => {
          set({ isLoading: true });
          try {
            const { data } = await api.post<AuthTokens>(
              '/auth/signup',
              signupData
            );
            set({
              accessToken: data.accessToken,
              isAuthenticated: true,
            });
            await get().fetchMe();
          } finally {
            set({ isLoading: false });
          }
        },

        logout: async () => {
          try {
            await api.post('/auth/logout');
          } finally {
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isDemo: false,
            });
          }
        },

        refresh: async () => {
          try {
            const { data } = await api.post<AuthTokens>('/auth/refresh');
            set({
              accessToken: data.accessToken,
              isAuthenticated: true,
            });
          } catch {
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
            });
          }
        },

        fetchMe: async () => {
          try {
            const { data } = await api.get<User>('/auth/me');
            set({ user: data, isAuthenticated: true });
          } catch {
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
            });
          }
        },

        setDemo: (demo) => set({ isDemo: demo }),
      };
    },
    {
      name: 'ghostnet-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);
