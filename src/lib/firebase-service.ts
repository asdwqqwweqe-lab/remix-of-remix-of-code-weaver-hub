import { initializeApp, FirebaseApp, getApps, deleteApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, remove, Database, DataSnapshot, off } from 'firebase/database';
import { useSettingsStore } from '@/store/settingsStore';
import { FirebaseConfig } from '@/types/blog';

let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;

/**
 * Initialize Firebase with config from settings
 */
export function initializeFirebase(config: FirebaseConfig): boolean {
  try {
    // Delete existing app if any
    if (firebaseApp) {
      deleteApp(firebaseApp);
      firebaseApp = null;
      database = null;
    }

    // Delete any existing apps
    const existingApps = getApps();
    existingApps.forEach(app => {
      if (app.name === 'dynamic-firebase') {
        deleteApp(app);
      }
    });

    firebaseApp = initializeApp(config, 'dynamic-firebase');
    database = getDatabase(firebaseApp);
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

/**
 * Get Firebase database instance
 */
export function getFirebaseDatabase(): Database | null {
  const config = useSettingsStore.getState().settings.firebaseConfig;
  if (!config?.apiKey || !config?.projectId) {
    return null;
  }
  
  if (!database) {
    initializeFirebase(config);
  }
  
  return database;
}

/**
 * Test Firebase connection
 */
export async function testFirebaseConnection(config: FirebaseConfig): Promise<{
  success: boolean;
  message: string;
  latency?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Initialize with test config
    const testApp = initializeApp(config, 'test-firebase-' + Date.now());
    const testDb = getDatabase(testApp);
    
    // Try to write and read a test value
    const testRef = ref(testDb, '.info/connected');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        deleteApp(testApp);
        resolve({ success: false, message: 'انتهت مهلة الاتصال (10 ثوانٍ)' });
      }, 10000);

      onValue(testRef, (snapshot) => {
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        deleteApp(testApp);
        
        if (snapshot.exists()) {
          resolve({ 
            success: true, 
            message: `تم الاتصال بنجاح`,
            latency 
          });
        } else {
          resolve({ 
            success: true, 
            message: 'تم الاتصال (قاعدة البيانات فارغة)',
            latency 
          });
        }
      }, (error) => {
        clearTimeout(timeout);
        deleteApp(testApp);
        resolve({ success: false, message: error.message });
      });
    });
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'خطأ في الاتصال' 
    };
  }
}

/**
 * Firebase Data Operations
 */
export const firebaseData = {
  /**
   * Save data to a path
   */
  async save<T>(path: string, data: T): Promise<boolean> {
    const db = getFirebaseDatabase();
    if (!db) return false;
    
    try {
      await set(ref(db, path), data);
      return true;
    } catch (error) {
      console.error(`Firebase save error at ${path}:`, error);
      return false;
    }
  },

  /**
   * Get data from a path
   */
  async get<T>(path: string): Promise<T | null> {
    const db = getFirebaseDatabase();
    if (!db) return null;
    
    try {
      const snapshot = await get(ref(db, path));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`Firebase get error at ${path}:`, error);
      return null;
    }
  },

  /**
   * Delete data at a path
   */
  async delete(path: string): Promise<boolean> {
    const db = getFirebaseDatabase();
    if (!db) return false;
    
    try {
      await remove(ref(db, path));
      return true;
    } catch (error) {
      console.error(`Firebase delete error at ${path}:`, error);
      return false;
    }
  },

  /**
   * Subscribe to data changes
   */
  subscribe<T>(path: string, callback: (data: T | null) => void): () => void {
    const db = getFirebaseDatabase();
    if (!db) {
      callback(null);
      return () => {};
    }
    
    const dataRef = ref(db, path);
    const unsubscribe = onValue(dataRef, (snapshot: DataSnapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    }, (error) => {
      console.error(`Firebase subscribe error at ${path}:`, error);
      callback(null);
    });
    
    return () => off(dataRef);
  },
};

/**
 * Sync stores with Firebase
 */
export async function syncToFirebase(): Promise<{ success: boolean; message: string }> {
  const db = getFirebaseDatabase();
  if (!db) {
    return { success: false, message: 'Firebase غير مُهيأ' };
  }

  try {
    // Get all data from localStorage
    const blogData = localStorage.getItem('blog-storage');
    const reportsData = localStorage.getItem('reports-storage');
    const roadmapData = localStorage.getItem('roadmap-storage');

    const timestamp = new Date().toISOString();

    if (blogData) {
      await set(ref(db, 'blog'), { data: JSON.parse(blogData), lastSync: timestamp });
    }
    if (reportsData) {
      await set(ref(db, 'reports'), { data: JSON.parse(reportsData), lastSync: timestamp });
    }
    if (roadmapData) {
      await set(ref(db, 'roadmap'), { data: JSON.parse(roadmapData), lastSync: timestamp });
    }

    return { success: true, message: 'تم المزامنة بنجاح' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'فشل المزامنة' 
    };
  }
}

/**
 * Restore data from Firebase to localStorage
 */
export async function syncFromFirebase(): Promise<{ success: boolean; message: string }> {
  const db = getFirebaseDatabase();
  if (!db) {
    return { success: false, message: 'Firebase غير مُهيأ' };
  }

  try {
    const blogSnapshot = await get(ref(db, 'blog/data'));
    const reportsSnapshot = await get(ref(db, 'reports/data'));
    const roadmapSnapshot = await get(ref(db, 'roadmap/data'));

    if (blogSnapshot.exists()) {
      localStorage.setItem('blog-storage', JSON.stringify(blogSnapshot.val()));
    }
    if (reportsSnapshot.exists()) {
      localStorage.setItem('reports-storage', JSON.stringify(reportsSnapshot.val()));
    }
    if (roadmapSnapshot.exists()) {
      localStorage.setItem('roadmap-storage', JSON.stringify(roadmapSnapshot.val()));
    }

    return { success: true, message: 'تم استعادة البيانات بنجاح - أعد تحميل الصفحة' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'فشل استعادة البيانات' 
    };
  }
}

/**
 * Get last sync time from Firebase
 */
export async function getLastSyncTime(): Promise<string | null> {
  const db = getFirebaseDatabase();
  if (!db) return null;

  try {
    const snapshot = await get(ref(db, 'blog/lastSync'));
    return snapshot.exists() ? snapshot.val() : null;
  } catch {
    return null;
  }
}

/**
 * Check if Firebase is configured and connected
 */
export function isFirebaseConfigured(): boolean {
  const config = useSettingsStore.getState().settings.firebaseConfig;
  return !!(config?.apiKey && config?.projectId && config?.databaseURL);
}
