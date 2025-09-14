import React, { createContext, useContext, ReactNode } from 'react';
import { UserSession } from '../types';
import { useSession } from '../hooks/useSession';

interface SessionContextType {
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
  initializeSession: () => Promise<void>;
  updateActivity: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const sessionData = useSession();

  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};
