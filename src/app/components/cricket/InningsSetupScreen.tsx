import React, { useState, useEffect } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { ScorecardEvent, Match, Team, Player } from '../../../engine/types';
import { toast } from 'sonner';

export const InningsSetupScreen: React.FC = () => {
  const nav = useNav();
  const { derivedState, dispatch } = useMatch();

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');

  if (!derivedState) return null;

  const { match } = derivedState;
  const isSecondInnings = match.innings.length === 1; // Innings setup for Innings 2

  // Determine batting and fielding teams
  let battingTeamIndex: 0 | 1 = 0;
  
  if (!isSecondInnings) {
    // Innings 1: derived from toss decision
    if (match.toss) {
      const winnerIndex = match.toss.winnerId === match.teams[0].id ? 0 : 1;
      const decision = match.toss.decision;
      if (decision === 'bat') {
        battingTeamIndex = winnerIndex;
      } else {
        battingTeamIndex = winnerIndex === 0 ? 1 : 0;
      }
    }
  } else {
    // Innings 2: opposite of Innings 1
    const innings1BattingIndex = match.innings[0].battingTeamIndex;
    battingTeamIndex = innings1BattingIndex === 0 ? 1 : 0;
  }

  const battingTeam = match.teams[battingTeamIndex];
  const fieldingTeam = match.teams[battingTeamIndex === 0 ? 1 : 0];

  // Pre-fill fields on open
  useEffect(() => {
    if (battingTeam.players.length >= 2 && fieldingTeam.players.length >= 1) {
      setStrikerId(battingTeam.players[0].id);
      setNonStrikerId(battingTeam.players[1].id);
      setBowlerId(fieldingTeam.players[0].id);
    }
  }, [battingTeam, fieldingTeam]);

  const handleStartInnings = async () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error('Please select opening batters and bowler.');
      return;
    }

    if (strikerId === nonStrikerId) {
      toast.error('Striker and Non-Striker must be different players.');
      return;
    }

    // Dispatch START_INNINGS event
    await dispatch({
      type: 'START_INNINGS',
      battingTeamIndex,
      strikerId,
      nonStrikerId,
      bowlerId,
    });

    // Go to Live Scoring Screen
    nav.go({ name: 'live' });
  };

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center justify-between shrink-0">
        <button
          onClick={() => nav.back()}
          className="text-sm font-semibold text-ink-700 hover:text-ink-900 cursor-pointer"
        >
          Back
        </button>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-ink-900 leading-none">
            {isSecondInnings ? 'Innings 2 Setup' : 'Innings 1 Setup'}
          </span>
          {!isSecondInnings && (
            <span className="text-[9px] text-pitch-700 font-extrabold uppercase tracking-widest mt-1">Step 5 of 5</span>
          )}
        </div>
        <div className="w-10"></div> {/* spacer */}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Info card */}
        <div className="bg-pitch-100 border border-pitch-700/20 text-pitch-700 p-3 rounded-xl text-xs font-semibold">
          {isSecondInnings ? (
            <span>
              Second Innings: <strong>{battingTeam.name}</strong> will bat and chase the target of <strong>{derivedState.inningsStates[0] ? derivedState.inningsStates[0].score + 1 : 0}</strong> runs.
            </span>
          ) : (
            <span>
              First Innings: <strong>{battingTeam.name}</strong> chose to bat first. <strong>{fieldingTeam.name}</strong> will bowl.
            </span>
          )}
        </div>

        {/* Batters Selector Card */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-4">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Opening Batters</span>

          {/* Striker Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-700 block">Striker (faces first ball)</label>
            <select
              value={strikerId}
              onChange={(e) => setStrikerId(e.target.value)}
              className="w-full bg-ink-100 border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink-900 font-semibold focus:outline-none focus:border-pitch-700 cursor-pointer"
            >
              <option value="" disabled>Select Striker</option>
              {battingTeam.players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Non-Striker Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-700 block">Non-Striker</label>
            <select
              value={nonStrikerId}
              onChange={(e) => setNonStrikerId(e.target.value)}
              className="w-full bg-ink-100 border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink-900 font-semibold focus:outline-none focus:border-pitch-700 cursor-pointer"
            >
              <option value="" disabled>Select Non-Striker</option>
              {battingTeam.players
                .filter(p => p.id !== strikerId)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Bowler Selector Card */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Opening Bowler</span>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-700 block">Bowler (bowls first over/set)</label>
            <select
              value={bowlerId}
              onChange={(e) => setBowlerId(e.target.value)}
              className="w-full bg-ink-100 border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink-900 font-semibold focus:outline-none focus:border-pitch-700 cursor-pointer"
            >
              <option value="" disabled>Select Bowler</option>
              {fieldingTeam.players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-card border-t border-ink-200 shrink-0">
        <button
          disabled={!strikerId || !nonStrikerId || !bowlerId || strikerId === nonStrikerId}
          onClick={handleStartInnings}
          className="w-full py-3.5 rounded-xl bg-pitch-700 text-white text-sm font-semibold active:scale-98 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:scale-100 shadow-md cursor-pointer text-center"
        >
          Start Innings 🚀
        </button>
      </div>
    </div>
  );
};
export default InningsSetupScreen;
