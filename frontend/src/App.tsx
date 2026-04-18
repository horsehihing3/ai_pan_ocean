import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import router from './router';
import useAuthStore from './store/authStore';

// [2026-04-17] 앱 루트 - RouterProvider + QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
});

export default function App() {
  const { initialized, setAccessToken, setUser, setInitialized } = useAuthStore();

  // [2026-04-18] 앱 시작 시 Refresh Token 쿠키로 세션 복원
  useEffect(() => {
    const restore = async () => {
      try {
        const refreshRes = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const token = refreshRes.data.data.accessToken;
        setAccessToken(token);
        const meRes = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUser(meRes.data.data);
      } catch {
        // refresh token 없음 또는 만료 — 로그인 필요
      } finally {
        setInitialized(true);
      }
    };
    restore();
  }, []);

  if (!initialized) {
    return <div className="flex items-center justify-center h-screen text-gray-400 text-sm">로딩 중...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
