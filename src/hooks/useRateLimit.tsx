import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Custom hook for client-side rate limiting with server-side validation
 * Prevents abuse of critical operations while providing good UX
 */
export function useRateLimit() {
  const [isRateLimited, setIsRateLimited] = useState(false);

  /**
   * Check rate limit for a specific action
   * @param action - The action being performed (e.g., 'profile_query', 'admin_operation')
   * @param maxRequests - Maximum number of requests allowed (default: 100)
   * @param timeWindowSeconds - Time window in seconds (default: 3600 = 1 hour)
   * @returns Promise<boolean> - true if allowed, false if rate limited
   */
  const checkRateLimit = useCallback(
    async (
      action: string,
      maxRequests: number = 100,
      timeWindowSeconds: number = 3600
    ): Promise<boolean> => {
      try {
        const { data, error } = await supabase.rpc("log_and_check_rate_limit", {
          _action: action,
          _max_requests: maxRequests,
          _time_window_seconds: timeWindowSeconds,
        });

        if (error) {
          // Check if it's a rate limit error
          if (error.message.includes("Rate limit exceeded")) {
            setIsRateLimited(true);
            toast.error(`Too many requests. Please try again later.`);
            
            // Reset rate limit flag after time window
            setTimeout(() => {
              setIsRateLimited(false);
            }, timeWindowSeconds * 1000);
            
            return false;
          }
          throw error;
        }

        return data !== false;
      } catch (error: any) {
        console.error("Rate limit check failed:", error);
        // Fail open - don't block users if rate limiting service is down
        return true;
      }
    },
    []
  );

  /**
   * Wrapper function that executes an operation only if rate limit allows
   * @param action - The action being performed
   * @param operation - The async operation to execute
   * @param maxRequests - Maximum requests allowed
   * @param timeWindowSeconds - Time window in seconds
   */
  const executeWithRateLimit = useCallback(
    async <T,>(
      action: string,
      operation: () => Promise<T>,
      maxRequests: number = 100,
      timeWindowSeconds: number = 3600
    ): Promise<T | null> => {
      const allowed = await checkRateLimit(action, maxRequests, timeWindowSeconds);
      
      if (!allowed) {
        return null;
      }

      return await operation();
    },
    [checkRateLimit]
  );

  return {
    isRateLimited,
    checkRateLimit,
    executeWithRateLimit,
  };
}

// Predefined rate limit configurations for common operations
export const RATE_LIMITS = {
  PROFILE_ACCESS: { maxRequests: 50, timeWindow: 3600 }, // 50 per hour
  ADMIN_OPERATION: { maxRequests: 100, timeWindow: 3600 }, // 100 per hour
  DATA_EXPORT: { maxRequests: 5, timeWindow: 3600 }, // 5 per hour
  FILE_UPLOAD: { maxRequests: 20, timeWindow: 3600 }, // 20 per hour
  API_CALL: { maxRequests: 100, timeWindow: 60 }, // 100 per minute
  SEARCH: { maxRequests: 50, timeWindow: 60 }, // 50 per minute
};