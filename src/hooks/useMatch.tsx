import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Match, ScorecardEvent, MatchDerivedState } from '../engine/types';
import { reduceMatchState } from '../engine/reducer';
import { saveEvent, getEventsForMatch, saveMatchMetadata, getAllMatchesMetadata, getMatchMetadata, deleteMatch } from '../db/matchStore';

interface MatchContextType {
  activeMatchId: string | null;
  derivedState: MatchDerivedState | null;
  isLoading: boolean;
  recentMatches: Match[];
  loadMatch: (id: string) => Promise<void>;
  startNewMatch: (match: Match) => Promise<void>;
  dispatch: (event: ScorecardEvent) => Promise<void>;
  undo: () => Promise<boolean>;
  deleteMatchData: (id: string) => Promise<void>;
  refreshRecentMatches: () => Promise<void>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<ScorecardEvent[]>([]);
  const [derivedState, setDerivedState] = useState<MatchDerivedState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);

  const refreshRecentMatches = useCallback(async () => {
    try {
      const list = await getAllMatchesMetadata();
      setRecentMatches(list);
    } catch (e) {
      console.error('Failed to load recent matches', e);
    }
  }, []);

  // Load recent matches on mount
  useEffect(() => {
    refreshRecentMatches();
  }, [refreshRecentMatches]);

  const loadMatch = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const events = await getEventsForMatch(id);
      setEventLog(events);
      
      const state = reduceMatchState(events);
      setDerivedState(state);
      setActiveMatchId(id);
    } catch (e) {
      console.error('Failed to load match events', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dispatch = useCallback(async (event: ScorecardEvent) => {
    if (!activeMatchId) return;

    try {
      // 1. Save event to IndexedDB
      await saveEvent(activeMatchId, event);

      // 2. Update local event log and state
      setEventLog(prev => {
        const nextLog = [...prev, event];
        const nextState = reduceMatchState(nextLog);
        
        // 3. Save updated match metadata to DB
        saveMatchMetadata(nextState.match).then(() => {
          refreshRecentMatches();
        });

        setDerivedState(nextState);
        return nextLog;
      });
    } catch (e) {
      console.error('Failed to dispatch event', e);
    }
  }, [activeMatchId, refreshRecentMatches]);

  const startNewMatch = useCallback(async (match: Match) => {
    setIsLoading(true);
    try {
      const setupEvent: ScorecardEvent = {
        type: 'SETUP_MATCH',
        match,
      };

      // Save initial metadata and event
      await saveMatchMetadata(match);
      await saveEvent(match.id, setupEvent);

      setActiveMatchId(match.id);
      setEventLog([setupEvent]);
      setDerivedState(reduceMatchState([setupEvent]));
      await refreshRecentMatches();
    } catch (e) {
      console.error('Failed to start new match', e);
    } finally {
      setIsLoading(false);
    }
  }, [refreshRecentMatches]);

  const undo = useCallback(async (): Promise<boolean> => {
    if (!activeMatchId || !derivedState || currentInningsIndex(derivedState) < 0) return false;

    // Find the last delivery event in the event log that hasn't been undone
    const activeInnings = derivedState.match.innings[derivedState.currentInningsIndex];
    if (!activeInnings || activeInnings.deliveries.length === 0) return false;

    // Get the last delivery
    const lastDelivery = activeInnings.deliveries[activeInnings.deliveries.length - 1];
    
    // Dispatch UNDO event
    await dispatch({
      type: 'UNDO_DELIVERY',
      deliveryId: lastDelivery.id,
    });

    return true;
  }, [activeMatchId, derivedState, dispatch]);

  const deleteMatchData = useCallback(async (id: string) => {
    try {
      await deleteMatch(id);
      if (activeMatchId === id) {
        setActiveMatchId(null);
        setEventLog([]);
        setDerivedState(null);
      }
      await refreshRecentMatches();
    } catch (e) {
      console.error('Failed to delete match', e);
    }
  }, [activeMatchId, refreshRecentMatches]);

  return (
    <MatchContext.Provider
      value={{
        activeMatchId,
        derivedState,
        isLoading,
        recentMatches,
        loadMatch,
        startNewMatch,
        dispatch,
        undo,
        deleteMatchData,
        refreshRecentMatches,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};

// Simple helper to find current innings index in a derived state
function currentInningsIndex(state: MatchDerivedState): number {
  return state.currentInningsIndex;
}
