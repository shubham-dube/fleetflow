import { QueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/types/api.types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error) => {
        const apiError = error as ApiError
        // Don't retry on 401, 403, 404
        if (apiError?.error?.code === 'UNAUTHORIZED') return false
        if (apiError?.error?.code === 'FORBIDDEN') return false
        if (apiError?.error?.code?.includes('NOT_FOUND')) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false, // Disable for dashboard heavy apps
    },
  },
})