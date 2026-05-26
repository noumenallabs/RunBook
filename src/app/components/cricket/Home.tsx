import React, { useState } from 'react';
import { Settings, Plus, Trophy, ListChecks, Users, ChevronRight, Trash2, HelpCircle } from 'lucide-react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { Match } from '../../../engine/types';
import { formatOvers } from '../../../engine/scoring';
import { toast } from 'sonner';

export const Home: React.FC = () => {
  const nav = useNav();
  const { recentMatches, loadMatch, startNewMatch, deleteMatchData } = useMatch();
  
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);
  const [isCompletedDelete, setIsCompletedDelete] = useState<boolean>(false);

  // Find if there is an in-progress match (state is not RESULT)
  const activeMatch = recentMatches.find(m => m.state !== 'RESULT');
  const completedMatches = recentMatches.filter(m => m.state === 'RESULT');

  const handleActiveMatchTap = async (match: Match) => {
    await loadMatch(match.id);
    // Navigate to the correct screen based on match state
    if (match.state === 'SETUP') {
      nav.go({ name: 'match_setup' });
    } else if (match.state === 'TOSS') {
      nav.go({ name: 'toss' });
    } else if (match.state === 'INNINGS_SETUP') {
      nav.go({ name: 'innings_setup' });
    } else if (match.state === 'SCORING') {
      nav.go({ name: 'live' });
    } else if (match.state === 'INNINGS_BREAK') {
      nav.go({ name: 'innings_break' });
    } else {
      nav.go({ name: 'home' });
    }
  };

  const handleNewMatchTap = async () => {
    if (activeMatch) {
      toast.error('Please finish or delete the current active match scoring session before starting a new one.');
      return;
    }
    nav.go({ name: 'match_setup' });
  };

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none">
      {/* S01 App Header */}
      <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Logo Glyph */}
          <div className="w-8 h-8 rounded-xl bg-pitch-700 flex items-center justify-center text-white font-bold shadow-md">
            🏏
          </div>
          <span className="text-base font-black text-ink-900 tracking-tight" style={{ fontFamily: 'var(--font-brand), sans-serif' }}>
            RunBook
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => nav.go({ name: 'help' })}
            className="p-2 text-ink-700 hover:bg-ink-200 rounded-xl active:scale-95 transition-transform cursor-pointer"
            aria-label="Help Center"
            type="button"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => nav.go({ name: 'settings' })}
            className="p-2 text-ink-700 hover:bg-ink-200 rounded-xl active:scale-95 transition-transform cursor-pointer"
            aria-label="Settings"
            type="button"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Primary Scrollable Area */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Active Scorings Widget */}
        {activeMatch && (
          <div className="p-4 shrink-0">
            <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-2">
              Active Match In Progress
            </span>
            <div className="relative group select-none">
              <button
                onClick={() => handleActiveMatchTap(activeMatch)}
                className="w-full text-left bg-gradient-to-br from-pitch-700 to-pitch-600 rounded-2xl p-4 shadow-lg text-white active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-white/20 text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10">
                      {activeMatch.format} Match
                    </span>
                    <h3 className="text-base font-black truncate max-w-[220px] pt-1">
                      {activeMatch.teams[0].name} vs {activeMatch.teams[1].name}
                    </h3>
                  </div>
                </div>
                <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-semibold">
                  <span className="text-white/80">State: {activeMatch.state}</span>
                  <span className="flex items-center gap-0.5">
                    Resume Scoring <ChevronRight size={14} />
                  </span>
                </div>
              </button>
              {/* Quick delete match button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCompletedDelete(false);
                  setDeleteMatchId(activeMatch.id);
                }}
                className="absolute top-2 right-2 p-1.5 text-white/50 hover:text-red-400 bg-black/20 hover:bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* S2: Quick Actions Grid */}
        <div className="px-4 mt-5 grid grid-cols-2 gap-3 shrink-0 select-none">
          <button
            onClick={handleNewMatchTap}
            className="h-24 rounded-2xl p-3 flex flex-col justify-between text-left bg-pitch-700 text-white hover:bg-pitch-600 active:scale-[0.97] transition-transform duration-100 shadow-md cursor-pointer"
          >
            <Plus size={22} className="text-white bg-white/20 p-0.5 rounded" />
            <span className="text-sm font-bold leading-tight">New Match</span>
          </button>

          <button
            onClick={() => nav.go({ name: 'tournament' })}
            className="h-24 rounded-2xl p-3 flex flex-col justify-between text-left bg-card border border-ink-200 text-ink-900 hover:border-pitch-700 active:scale-[0.97] transition-transform duration-100 shadow-sm cursor-pointer"
          >
            <Trophy size={22} className="text-pitch-700" />
            <div>
              <span className="text-sm font-bold leading-tight block">Tournament</span>
              <span className="text-[9px] text-ink-400 font-bold uppercase tracking-wider">Coming Soon</span>
            </div>
          </button>

          <button
            onClick={async () => {
              if (completedMatches.length > 0) {
                await loadMatch(completedMatches[0].id);
                nav.go({ name: 'scorecard' });
              } else {
                toast.error('No completed matches available yet.');
              }
            }}
            className="h-24 rounded-2xl p-3 flex flex-col justify-between text-left bg-card border border-ink-200 text-ink-900 hover:border-pitch-700 active:scale-[0.97] transition-transform duration-100 shadow-sm cursor-pointer"
          >
            <ListChecks size={22} className="text-pitch-700" />
            <span className="text-sm font-bold leading-tight">Recent Scorecard</span>
          </button>

          <div className="h-24 rounded-2xl p-3 flex flex-col justify-between text-left bg-card border border-ink-200 text-ink-400 shadow-sm opacity-50">
            <Users size={22} className="text-ink-400" />
            <span className="text-sm font-bold leading-tight">Teams DB</span>
          </div>
        </div>

        {/* S3: Match History List */}
        <div className="px-4 mt-6">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-2">
            Completed Matches History ({completedMatches.length})
          </span>
          {completedMatches.length === 0 ? (
            <div className="bg-card border border-ink-200 rounded-2xl p-6 text-center italic text-ink-400 text-xs font-semibold">
              No completed scorecards in history yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {completedMatches.map(match => {
                const res = match.result;
                const score1 = match.innings[0]?.deliveries.reduce((sum, d) => sum + d.runs + (d.deliveryType !== 'legal' ? 1 : 0), 0) || 0;
                const wickets1 = match.innings[0]?.deliveries.filter(d => d.wicket).length || 0;
                const balls1 = match.innings[0]?.deliveries.filter(d => d.deliveryType === 'legal').length || 0;
                
                const showInn2 = match.innings.length > 1 && match.innings[1];
                const formatIsHundred = match.format === 'Hundred';

                return (
                  <div key={match.id} className="relative group select-none">
                    <button
                      onClick={async () => {
                        await loadMatch(match.id);
                        nav.go({ name: 'scorecard' });
                      }}
                      className="w-full text-left bg-card border border-ink-200 hover:border-pitch-700 p-4 rounded-2xl shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-2">
                        <span>{match.format} Match</span>
                        <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-ink-900">{match.teams[0].name}</span>
                          <span className="font-mono text-ink-700 text-xs font-bold">
                            {score1}/{wickets1} <span className="text-[10px] text-ink-400 font-semibold">({formatOvers(balls1, formatIsHundred)} ov)</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-ink-900">{match.teams[1].name}</span>
                          {showInn2 && match.innings[1] && (
                            <span className="font-mono text-ink-700 text-xs">
                              {match.innings[1].deliveries.reduce((sum, d) => sum + d.runs + (d.deliveryType !== 'legal' ? 1 : 0), 0)} runs
                            </span>
                          )}
                        </div>
                      </div>

                      {res && (
                        <div className="mt-2 pt-1.5 border-t border-ink-100 text-xs text-pitch-700 font-bold flex items-center justify-between">
                          <span>{res.description}</span>
                          <ChevronRight size={12} />
                        </div>
                      )}
                    </button>

                    {/* Delete completed match button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCompletedDelete(true);
                        setDeleteMatchId(match.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 text-ink-300 hover:text-red-600 bg-ink-50 hover:bg-red-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete record"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Custom delete confirmation dialog overlay */}
      {deleteMatchId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteMatchId(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-ink-900">
                {isCompletedDelete ? 'Delete Completed Scorecard?' : 'Delete Scoring Session?'}
              </h3>
              <p className="text-xs text-ink-600 font-medium leading-relaxed">
                {isCompletedDelete
                  ? 'Are you sure you want to permanently delete this completed match scorecard from history? This action cannot be undone.'
                  : 'Are you sure you want to delete this active match scoring session? All current innings scoring progress will be lost.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteMatchId(null)}
                className="flex-1 py-2.5 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 hover:bg-ink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteMatchData(deleteMatchId);
                  setDeleteMatchId(null);
                  toast.success(
                    isCompletedDelete
                      ? 'Completed match scorecard removed.'
                      : 'Active match scoring session discarded.'
                  );
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 cursor-pointer shadow-sm animate-pulse"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;
