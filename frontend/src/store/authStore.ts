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
  initialized: boolean; // [2026-04-18] 앱 시작 시 세션 복원 완료 여부
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setInitialized: (v: boolean) => void;
  logout: () => void;
}

// [2026-04-17] Zustand 인증 스토어
const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  initialized: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setInitialized: (v) => set({ initialized: v }),
  logout: () => set({ accessToken: null, user: null }),
}));

export default useAuthStore;
