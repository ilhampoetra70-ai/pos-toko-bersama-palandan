import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,          // 30s fresh
            gcTime: 5 * 60_000,         // 5min cache
            retry: 1,
            refetchOnWindowFocus: false, // Optimized for Electron
            refetchOnReconnect: false,
        },
        mutations: {
            retry: 0,
        },
    },
});
