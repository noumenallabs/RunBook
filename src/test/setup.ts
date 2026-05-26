import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import { Match, ScorecardEvent } from '../engine/types';

// In-memory mock database for testing
const matchesStore = new Map<string, Match>();
const eventsStore = new Map<string, Array<{ id: string; event: ScorecardEvent; timestamp: number; matchId: string }>>();

beforeEach(() => {
  matchesStore.clear();
  eventsStore.clear();
  vi.clearAllMocks();
});

// Mock the IndexedDB storage layer
vi.mock('../db/matchStore', () => {
  return {
    saveEvent: async (matchId: string, event: ScorecardEvent) => {
      const eventId = 'mock-event-' + Math.random().toString(36).substring(2, 9);
      if (!eventsStore.has(matchId)) {
        eventsStore.set(matchId, []);
      }
      eventsStore.get(matchId)!.push({
        id: eventId,
        event,
        timestamp: Date.now(),
        matchId,
      });
      return eventId;
    },
    getEventsForMatch: async (matchId: string) => {
      const entries = eventsStore.get(matchId) || [];
      return entries.map(e => e.event);
    },
    saveMatchMetadata: async (match: Match) => {
      matchesStore.set(match.id, JSON.parse(JSON.stringify(match)));
    },
    getMatchMetadata: async (matchId: string) => {
      const match = matchesStore.get(matchId);
      return match ? JSON.parse(JSON.stringify(match)) : undefined;
    },
    getAllMatchesMetadata: async () => {
      return Array.from(matchesStore.values())
        .map(m => JSON.parse(JSON.stringify(m)))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    deleteMatch: async (matchId: string) => {
      matchesStore.delete(matchId);
      eventsStore.delete(matchId);
    },
    generateUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 9),
  };
});

// Mock browser APIs
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn(() => true),
    writable: true,
  });
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true,
  });
}
