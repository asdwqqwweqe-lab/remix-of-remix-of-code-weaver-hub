import { createContext, useContext, ReactNode } from 'react';
import { useFirebaseAutoSync } from '@/hooks/useFirebaseSync';

interface SyncContextValue {
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextValue>({
  autoSyncEnabled: false,
  lastSyncTime: null,
  isSyncing: false,
});

export const useSyncStatus = () => useContext(SyncContext);

/**
 * Provider that enables Firebase auto-sync and exposes sync status
 */
export default function FirebaseAutoSyncProvider({ children }: { children: ReactNode }) {
  const syncStatus = useFirebaseAutoSync();
  
  return (
    <SyncContext.Provider value={syncStatus}>
      {children}
    </SyncContext.Provider>
  );
}
