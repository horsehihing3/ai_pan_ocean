import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'PARTNER' | 'ADMIN' | 'CONTRACT_DEPT';
  companyId?: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

// [2026-04-17] Zustand 인증 스토어
const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));

export default useAuthStore;
