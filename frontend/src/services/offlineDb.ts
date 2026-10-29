/**
 * FAUNA-X: Offline Storage & Sync Engine (IndexedDB)
 * Empowers rural farmers to draft health reports and photos offline in field areas.
 */
import { openDB, DBSchema } from 'idb';
import { api } from './api';

export interface OfflineReport {
  id?: number;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  number_affected: number;
  symptoms: string[];
  latitude?: number;
  longitude?: number;
  location_name?: string;
  history?: Record<string, any>;
  imageBlob?: Blob | null;
  saved_at: string;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
}

interface FaunaXDB extends DBSchema {
  offline_reports: {
    key: number;
    value: OfflineReport;
    indexes: { 'by-status': string };
  };
}

const DB_NAME = 'faunax_offline_v1';

export async function getOfflineDB() {
  return openDB<FaunaXDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('offline_reports')) {
        const store = db.createObjectStore('offline_reports', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-status', 'sync_status');
      }
    },
  });
}

export async function saveOfflineReport(report: any): Promise<number> {
  const db = await getOfflineDB();
  const entry: OfflineReport = {
    ...report,
    saved_at: new Date().toISOString(),
    sync_status: 'PENDING',
  };
  return db.add('offline_reports', entry as any);
}

export async function getPendingOfflineReports(): Promise<OfflineReport[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex('offline_reports', 'by-status', 'PENDING');
}

export async function markReportSynced(id: number): Promise<void> {
  const db = await getOfflineDB();
  const item = await db.get('offline_reports', id);
  if (item) {
    item.sync_status = 'SYNCED';
    await db.put('offline_reports', item);
  }
}

export async function syncPendingReports(): Promise<number> {
  if (!navigator.onLine) return 0;
  const pending = await getPendingOfflineReports();
  let count = 0;

  for (const report of pending) {
    try {
      const casePayload = {
        species: report.species,
        breed: report.breed,
        age: report.age,
        sex: report.sex,
        number_affected: report.number_affected,
        symptoms: report.symptoms,
        latitude: report.latitude || 20.5937,
        longitude: report.longitude || 78.9629,
        location_name: report.location_name || 'Offline Field Report',
        history: report.history,
      };

      const created = await api.createCase(casePayload);
      if (report.imageBlob) {
        const file = new File([report.imageBlob], 'offline_photo.jpg', { type: 'image/jpeg' });
        await api.uploadCaseImage(created.id, file);
      }
      if (report.id) {
        await markReportSynced(report.id);
      }
      count++;
    } catch (err) {
      console.error('Failed to sync offline report ID', report.id, err);
    }
  }

  return count;
}

export const offlineDb = {
  getOfflineDB,
  saveOfflineReport,
  getPendingOfflineReports,
  markReportSynced,
  syncPendingReports,
};
