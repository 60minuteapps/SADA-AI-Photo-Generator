import { useState, useEffect, useCallback } from 'react';
import { UserSession } from '../types';
import { supabaseService } from '../services/supabase';
import * as Device from 'expo-device';

interface UseSessionReturn {
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
  initializeSession: () => Promise<void>;
  updateActivity: () => Promise<void>;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get device ID for session tracking
      const deviceId = Device.osInternalBuildId || Device.deviceName || 'unknown';
      
      const initializedSession = await supabaseService.initializeSession(deviceId);
      setSession(initializedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMessage);
      console.error('Session initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateActivity = useCallback(async () => {
    try {
      await supabaseService.updateSessionActivity();
    } catch (err) {
      console.error('Failed to update session activity:', err);
    }
  }, []);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Update activity every 5 minutes when app is active
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [session, updateActivity]);

  return {
    session,
    isLoading,
    error,
    initializeSession,
    updateActivity,
  };
};
