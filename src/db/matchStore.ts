import { openDB, IDBPDatabase } from 'idb';
import { Match, EventEntry, ScorecardEvent } from '../engine/types';

const DB_NAME = 'runbook-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function initDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store for match event logs
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('matchId', 'matchId', { unique: false });
          eventStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        // Store for match metadata index (easy dashboard listings)
        if (!db.objectStoreNames.contains('matches')) {
          db.createObjectStore('matches', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Generate UUID v4 (simple fallback for local ID creation)
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Save an event to the match event log.
 */
export async function saveEvent(matchId: string, event: ScorecardEvent): Promise<string> {
  const db = await initDb();
  const eventId = generateUUID();
  const entry: EventEntry = {
    id: eventId,
    event,
    timestamp: Date.now(),
    matchId,
  };

  const tx = db.transaction('events', 'readwrite');
  await tx.objectStore('events').put(entry);
  await tx.done;

  return eventId;
}

/**
 * Retrieve all events for a match in chronological order.
 */
export async function getEventsForMatch(matchId: string): Promise<ScorecardEvent[]> {
  const db = await initDb();
  const tx = db.transaction('events', 'readonly');
  const index = tx.objectStore('events').index('matchId');
  const entries: EventEntry[] = await index.getAll(IDBKeyRange.only(matchId));
  await tx.done;

  // Sort by timestamp just in case
  return entries
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(entry => entry.event);
}

/**
 * Save match metadata.
 */
export async function saveMatchMetadata(match: Match): Promise<void> {
  const db = await initDb();
  const tx = db.transaction('matches', 'readwrite');
  await tx.objectStore('matches').put(match);
  await tx.done;
}

/**
 * Get match metadata by ID.
 */
export async function getMatchMetadata(matchId: string): Promise<Match | undefined> {
  const db = await initDb();
  const tx = db.transaction('matches', 'readonly');
  const match = await tx.objectStore('matches').get(matchId);
  await tx.done;
  return match;
}

/**
 * Get all saved matches metadata.
 */
export async function getAllMatchesMetadata(): Promise<Match[]> {
  const db = await initDb();
  const tx = db.transaction('matches', 'readonly');
  const matches = await tx.objectStore('matches').getAll();
  await tx.done;
  // Return sorted by date descending
  return matches.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Delete all match data (events + metadata).
 */
export async function deleteMatch(matchId: string): Promise<void> {
  const db = await initDb();
  
  // Delete metadata
  const matchTx = db.transaction('matches', 'readwrite');
  await matchTx.objectStore('matches').delete(matchId);
  await matchTx.done;

  // Delete associated events
  const eventTx = db.transaction('events', 'readwrite');
  const eventStore = eventTx.objectStore('events');
  const index = eventStore.index('matchId');
  const entries: EventEntry[] = await index.getAll(IDBKeyRange.only(matchId));
  
  const deletePromises = entries.map(entry => eventStore.delete(entry.id));
  await Promise.all(deletePromises);
  await eventTx.done;
}
