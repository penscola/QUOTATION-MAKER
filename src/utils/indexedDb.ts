import { QuotationData } from '../types/quote';
import { calculateQuotationTotals } from './pricing';

const DB_NAME = 'OneStepSolution_QuotationDB';
const DB_VERSION = 2; // Incremented for saved_quotations store
const DRAFT_STORE = 'quotation_drafts';
const HISTORY_STORE = 'quotation_history';
const SAVED_QUOTES_STORE = 'saved_quotations';
const MAX_HISTORY_ITEMS = 15;

export interface QuotationSnapshot {
  id?: number;
  timestamp: number;
  quoteNumber: string;
  clientName: string;
  itemCount: number;
  totalAmount: number;
  currency: string;
  data: QuotationData;
}

export interface SavedQuoteRecord {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientCompany?: string;
  documentDate: string;
  createdAt: number;
  updatedAt: number;
  itemCount: number;
  totalAmount: number;
  currency: string;
  projectDescription?: string;
  data: QuotationData;
}

// Fallback localStorage key
export const LOCAL_STORAGE_KEY = 'quotecraft_current_quote';
export const LOCAL_STORAGE_BACKUP_KEY = 'quotecraft_emergency_backup';

/**
 * Open or upgrade the IndexedDB instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store 1: Current active working draft
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'key' });
      }

      // Store 2: Historical recovery snapshots (for unexpected crash or rollback)
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store 3: Saved Quotes library (organized by client name and date)
      if (!db.objectStoreNames.contains(SAVED_QUOTES_STORE)) {
        const savedStore = db.createObjectStore(SAVED_QUOTES_STORE, { keyPath: 'id' });
        savedStore.createIndex('clientName', 'clientName', { unique: false });
        savedStore.createIndex('documentDate', 'documentDate', { unique: false });
        savedStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save current active quotation to IndexedDB
 */
export async function saveQuotationToIndexedDB(
  data: QuotationData
): Promise<{ success: boolean; timestamp: number }> {
  const timestamp = Date.now();

  // Always dual-write immediately to localStorage as synchronous emergency fallback
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_time', timestamp.toString());
  } catch (err) {
    console.warn('LocalStorage save failed, relying on IndexedDB:', err);
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([DRAFT_STORE], 'readwrite');
      const store = tx.objectStore(DRAFT_STORE);

      const record = {
        key: 'active',
        timestamp,
        data,
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        resolve({ success: true, timestamp });
      };

      putRequest.onerror = () => {
        reject(putRequest.error || new Error('Could not write to IndexedDB'));
      };
    });
  } catch (err) {
    console.error('IndexedDB save failed:', err);
    return { success: false, timestamp };
  }
}

/**
 * Save a recovery snapshot to history store (created periodically or on key milestones)
 */
export async function createRecoverySnapshot(
  data: QuotationData
): Promise<number | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);

      const breakdown = calculateQuotationTotals(data.items || [], data.pricing);
      const total = breakdown.grandTotal;

      const snapshot: QuotationSnapshot = {
        timestamp: Date.now(),
        quoteNumber: data.details.quoteNumber || 'Draft',
        clientName: data.client.name || 'Unnamed Client',
        itemCount: data.items.length,
        totalAmount: total,
        currency: data.pricing?.currencySymbol || 'KSh',
        data: JSON.parse(JSON.stringify(data)),
      };

      const addRequest = store.add(snapshot);

      addRequest.onsuccess = () => {
        pruneOldHistory(store);
        resolve(addRequest.result as number);
      };

      addRequest.onerror = () => {
        reject(addRequest.error);
      };
    });
  } catch (e) {
    console.warn('Failed to record recovery snapshot:', e);
    return null;
  }
}

/**
 * Prunes history to keep only the latest MAX_HISTORY_ITEMS
 */
function pruneOldHistory(store: IDBObjectStore) {
  try {
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      const count = countRequest.result;
      if (count > MAX_HISTORY_ITEMS) {
        const excess = count - MAX_HISTORY_ITEMS;
        let deleted = 0;
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor && deleted < excess) {
            cursor.delete();
            deleted++;
            cursor.continue();
          }
        };
      }
    };
  } catch (err) {
    console.warn('Error during history pruning:', err);
  }
}

/**
 * Load active quotation draft from IndexedDB (with fallback to localStorage)
 */
export async function loadQuotationFromIndexedDB(): Promise<{
  quotation: QuotationData;
  timestamp: number;
  source: 'indexeddb' | 'localstorage' | 'none';
} | null> {
  let idbResult: { quotation: QuotationData; timestamp: number } | null = null;

  try {
    const db = await openDatabase();
    idbResult = await new Promise((resolve) => {
      const tx = db.transaction([DRAFT_STORE], 'readonly');
      const store = tx.objectStore(DRAFT_STORE);
      const req = store.get('active');

      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve({
            quotation: req.result.data,
            timestamp: req.result.timestamp || Date.now(),
          });
        } else {
          resolve(null);
        }
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch (e) {
    console.warn('Could not read from IndexedDB, trying localStorage:', e);
  }

  // Check localStorage as well
  let localResult: { quotation: QuotationData; timestamp: number } | null = null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const rawTime = localStorage.getItem(LOCAL_STORAGE_KEY + '_time');
    if (raw) {
      localResult = {
        quotation: JSON.parse(raw),
        timestamp: rawTime ? parseInt(rawTime, 10) : 0,
      };
    }
  } catch (e) {
    console.warn('Could not read from localStorage:', e);
  }

  // Return the freshest data between IndexedDB and LocalStorage
  if (idbResult && localResult) {
    if (idbResult.timestamp >= localResult.timestamp) {
      return { ...idbResult, source: 'indexeddb' };
    } else {
      return { ...localResult, source: 'localstorage' };
    }
  }

  if (idbResult) {
    return { ...idbResult, source: 'indexeddb' };
  }

  if (localResult) {
    return { ...localResult, source: 'localstorage' };
  }

  return null;
}

/**
 * Fetch all available recovery snapshots
 */
export async function getRecoverySnapshots(): Promise<QuotationSnapshot[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([HISTORY_STORE], 'readonly');
      const store = tx.objectStore(HISTORY_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const snapshots = (req.result as QuotationSnapshot[]) || [];
        // Sort newest first
        snapshots.sort((a, b) => b.timestamp - a.timestamp);
        resolve(snapshots);
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch (e) {
    console.warn('Failed to get recovery snapshots:', e);
    return [];
  }
}

/**
 * Delete a specific snapshot from history
 */
export async function deleteRecoverySnapshot(id: number): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Emergency synchronous flush for window.beforeunload / pagehide
 */
export function flushEmergencySync(data: QuotationData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_time', Date.now().toString());
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify({
      timestamp: Date.now(),
      quoteNumber: data.details.quoteNumber,
      clientName: data.client.name,
    }));
  } catch (e) {
    // ignore
  }
}

// =========================================================================
// SAVED QUOTES MANAGEMENT (Library of previous drafts by client & date)
// =========================================================================

/**
 * Save current or edited quotation into the persistent 'saved_quotations' library
 */
export async function saveQuoteToLibrary(
  data: QuotationData,
  existingId?: string
): Promise<SavedQuoteRecord> {
  const db = await openDatabase();
  const breakdown = calculateQuotationTotals(data.items || [], data.pricing);
  const now = Date.now();

  const id = existingId || `quote_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const record: SavedQuoteRecord = {
    id,
    quoteNumber: data.details.quoteNumber || '1001',
    clientName: data.client.name || 'Unnamed Client',
    clientCompany: data.client.company || '',
    documentDate: data.details.date || new Date().toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
    itemCount: data.items.length,
    totalAmount: breakdown.grandTotal,
    currency: data.pricing?.currencySymbol || 'KSh',
    projectDescription: data.details.projectDescription || '',
    data: JSON.parse(JSON.stringify(data)),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([SAVED_QUOTES_STORE], 'readwrite');
    const store = tx.objectStore(SAVED_QUOTES_STORE);

    // If updating, preserve original createdAt
    if (existingId) {
      const getReq = store.get(existingId);
      getReq.onsuccess = () => {
        if (getReq.result && getReq.result.createdAt) {
          record.createdAt = getReq.result.createdAt;
        }
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(record);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => {
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(record);
        putReq.onerror = () => reject(putReq.error);
      };
    } else {
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve(record);
      putReq.onerror = () => reject(putReq.error);
    }
  });
}

/**
 * Retrieve all saved quotations from IndexedDB library.
 * Seeds initial demo drafts if the library is empty so the user has immediate examples.
 */
export async function getSavedQuotes(): Promise<SavedQuoteRecord[]> {
  try {
    const db = await openDatabase();
    const records = await new Promise<SavedQuoteRecord[]>((resolve) => {
      const tx = db.transaction([SAVED_QUOTES_STORE], 'readonly');
      const store = tx.objectStore(SAVED_QUOTES_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve((req.result as SavedQuoteRecord[]) || []);
      };

      req.onerror = () => {
        resolve([]);
      };
    });

    // If empty on first visit, seed two realistic sample drafts to showcase client & date grouping
    if (records.length === 0) {
      const seeded = await seedInitialQuotes(db);
      return seeded;
    }

    // Sort by documentDate or updatedAt descending
    records.sort((a, b) => b.updatedAt - a.updatedAt);
    return records;
  } catch (e) {
    console.warn('Failed to get saved quotes from library:', e);
    return [];
  }
}

/**
 * Delete a quote record from the saved library
 */
export async function deleteSavedQuote(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([SAVED_QUOTES_STORE], 'readwrite');
      const store = tx.objectStore(SAVED_QUOTES_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Seed initial sample quotes into the library
 */
async function seedInitialQuotes(db: IDBDatabase): Promise<SavedQuoteRecord[]> {
  const sample1: SavedQuoteRecord = {
    id: 'seed_quote_1',
    quoteNumber: '1024',
    clientName: 'Mary Anne Garcia',
    clientCompany: 'AOTA Corporate Towers',
    documentDate: '2026-10-15',
    createdAt: Date.now() - 14 * 86400000,
    updatedAt: Date.now() - 14 * 86400000,
    itemCount: 4,
    totalAmount: 435000,
    currency: 'KSh',
    projectDescription: 'Enterprise IT Infrastructure, Structured Cabling & Access Control Installation',
    data: {
      company: {
        name: 'ONE STEP SOLUTION LTD',
        tagline: 'ONE STEP. ENDLESS SOLUTIONS.',
        address: 'THE WESTCOM POINT, MAHIGA MAIRU AVE, WESTLANDS, NAIROBI',
        phone: '+254 111 537 414',
        website: 'onestependlesssolutions@gmail.com',
        logoUrl: '/assets/aistudio/image_6276447f.png',
      },
      client: {
        name: 'Mary Anne Garcia',
        company: 'AOTA Corporate Towers',
        address: '123 Lingkod St., Pamayanan City 1234',
        phone: '+254 700 890 123',
        customerId: 'CUST-8842',
      },
      details: {
        quoteNumber: '1024',
        date: '2026-10-15',
        validUntil: '2026-11-15',
        projectDescription: 'Enterprise IT Infrastructure, Structured Cabling & Access Control Installation',
      },
      items: [
        { id: '1', description: 'Cat6 UTP Structured Network Cabling & Patch Panels (300m)', quantity: 2, price: 65000 },
        { id: '2', description: 'Cisco Gigabit 24-Port Managed PoE Switch', quantity: 2, price: 95000 },
        { id: '3', description: 'Biometric Access Control Terminal with Facial Recognition', quantity: 3, price: 28000 },
        { id: '4', description: 'System Configuration, Testing and Handover Documentation', quantity: 1, price: 31000 },
      ],
      pricing: {
        currencySymbol: 'KSh',
        taxRatePercent: 16,
        taxAmount: 60000,
        taxEnabled: true,
        discountType: 'percentage',
        discountValue: 0,
        othersFee: 0,
      },
      terms: 'Above information is an official estimate. 60% down payment required prior to delivery, 40% upon handover.',
      signature: {
        printedName: 'Felix Mwangi',
        dateSigned: '2026-10-15',
      },
      themeColor: '#0284c7',
    },
  };

  const sample2: SavedQuoteRecord = {
    id: 'seed_quote_2',
    quoteNumber: '1025',
    clientName: 'Amina Mohamed',
    clientCompany: 'Kilifi Coast Logistics Ltd',
    documentDate: '2026-10-22',
    createdAt: Date.now() - 7 * 86400000,
    updatedAt: Date.now() - 7 * 86400000,
    itemCount: 3,
    totalAmount: 185600,
    currency: 'KSh',
    projectDescription: 'Commercial Fleet GPS Tracking & Real-Time Fuel Monitoring Telematics',
    data: {
      company: {
        name: 'ONE STEP SOLUTION LTD',
        tagline: 'ONE STEP. ENDLESS SOLUTIONS.',
        address: 'THE WESTCOM POINT, MAHIGA MAIRU AVE, WESTLANDS, NAIROBI',
        phone: '+254 111 537 414',
        website: 'onestependlesssolutions@gmail.com',
        logoUrl: '/assets/aistudio/image_6276447f.png',
      },
      client: {
        name: 'Amina Mohamed',
        company: 'Kilifi Coast Logistics Ltd',
        address: 'Mombasa Port Road, Commercial Zone 4',
        phone: '+254 712 345 678',
        customerId: 'CUST-9120',
      },
      details: {
        quoteNumber: '1025',
        date: '2026-10-22',
        validUntil: '2026-11-22',
        projectDescription: 'Commercial Fleet GPS Tracking & Real-Time Fuel Monitoring Telematics',
      },
      items: [
        { id: '1', description: 'Heavy Duty 4G GPS Tracker Units with CANBus reader', quantity: 5, price: 18000 },
        { id: '2', description: 'Capacitive Digital Fuel Level Ultrasonic Sensors', quantity: 5, price: 12000 },
        { id: '3', description: 'Onsite Installation, Calibration & Annual Cloud Telematics Software', quantity: 1, price: 20000 },
      ],
      pricing: {
        currencySymbol: 'KSh',
        taxRatePercent: 16,
        taxAmount: 25600,
        taxEnabled: true,
        discountType: 'percentage',
        discountValue: 5,
        othersFee: 0,
      },
      terms: 'Warranty: 12 months on all telematics hardware. Includes 24/7 technical support.',
      signature: {
        printedName: 'Felix Mwangi',
        dateSigned: '2026-10-22',
      },
      themeColor: '#0284c7',
    },
  };

  try {
    const tx = db.transaction([SAVED_QUOTES_STORE], 'readwrite');
    const store = tx.objectStore(SAVED_QUOTES_STORE);
    store.put(sample1);
    store.put(sample2);
    return [sample2, sample1];
  } catch (err) {
    return [];
  }
}
