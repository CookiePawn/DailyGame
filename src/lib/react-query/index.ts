import { QueryClient } from '@tanstack/react-query';
import { instance } from '@/services/axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey: [url, params] }) => instance.get(url as string, { params }),
      retry: 0,
    },
  },
});