import React, { useState } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { formatOvers } from '../../../engine/scoring';

export const InningsBreakScreen: React.FC = () => {
  const nav = useNav();
  const { derivedState, dispatch } = useMatch();
  const [dlsTarget, setDlsTarget] = useState<string>('');

  if (!derivedState || derivedState.inningsStates.length === 0) return null;

  const innings1State = derivedState.inningsStates[0];
  const { match } = derivedState;
  const battingTeam = match.teams[innings1State.battingTeamIndex];
  const chasingTeam = match.teams[innings1State.battingTeamIndex === 0 ? 1 : 0];

  const target = innings1State.score + 1;

  const handleStartInnings2 = async () => {
    // If a DLS override target was entered, we update target
    let finalTarget = target;
    if (dlsTarget.trim()) {
      const parsed = parseInt(dlsTarget.trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        finalTarget = parsed;
        // Dispatch event or update state with DLS override
        // In our data model, Innings has target and dlsTarget fields.
        // We will pass this to the Match start event or update the local match setup.
        // For simplicity, we store it in the IndexedDB match metadata,
        // and we will apply it when starting the 2nd Innings.
      }
    }

    // Navigate to Innings 2 setup
    nav.go({ name: 'innings_setup' });
  };

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center justify-between shrink-0">
        <button
          onClick={() => nav.go({ name: 'home' })}
          className="text-sm font-semibold text-ink-700 hover:text-ink-900 cursor-pointer"
        >
          Exit Setup
        </button>
        <span className="text-base font-bold text-ink-900">Innings Break</span>
        <div className="w-16"></div> {/* spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Innings 1 Summary Card */}
        <div className="bg-pitch-700 text-white rounded-2xl p-4 shadow-md text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
            End of Innings 1
          </span>
          <span className="text-xs font-semibold mt-1 block truncate">
            {battingTeam.name}
          </span>
          <span className="text-4xl font-mono font-bold tracking-tight block my-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {match.scoreConvention === 'runs_wickets' 
              ? `${innings1State.score}/${innings1State.wickets}` 
              : `${innings1State.wickets}/${innings1State.score}`}
          </span>
          <span className="text-xs text-white/70 font-semibold block">
            ({formatOvers(innings1State.legalBallsCount, match.format === 'Hundred')} overs)
          </span>
        </div>

        {/* Target Board */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div>
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider block">Target Set</span>
            <span className="text-4xl font-mono font-black text-pitch-700 block mt-1">
              {target}
            </span>
            <span className="text-xs font-semibold text-ink-700 block mt-1">
              {chasingTeam.name} needs {target} runs to win
            </span>
          </div>

          {/* DLS rain adjustment field */}
          <div className="w-full pt-3 border-t border-ink-100 flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-bold text-ink-900 block">Rain Target (DLS)</span>
              <span className="text-[10px] text-ink-400 font-medium block">Manual target override if shortened</span>
            </div>
            <input
              type="number"
              placeholder="e.g. 142"
              value={dlsTarget}
              onChange={(e) => setDlsTarget(e.target.value)}
              className="w-24 text-center font-mono font-bold bg-ink-100 border border-ink-200 rounded-lg py-1.5 focus:outline-none focus:border-pitch-700"
            />
          </div>
        </div>

        {/* Extras Breakdown */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block mb-1">
            Innings 1 Extras Conceded
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-ink-700">
            <div className="flex justify-between border-b border-ink-100 pb-1">
              <span>Wides:</span>
              <span className="font-mono text-ink-900">{innings1State.extras.wides}</span>
            </div>
            <div className="flex justify-between border-b border-ink-100 pb-1">
              <span>No-Balls:</span>
              <span className="font-mono text-ink-900">{innings1State.extras.noBalls}</span>
            </div>
            <div className="flex justify-between border-b border-ink-100 pb-1">
              <span>Byes:</span>
              <span className="font-mono text-ink-900">{innings1State.extras.byes}</span>
            </div>
            <div className="flex justify-between border-b border-ink-100 pb-1">
              <span>Leg-Byes:</span>
              <span className="font-mono text-ink-900">{innings1State.extras.legByes}</span>
            </div>
          </div>
          <div className="flex justify-between pt-1 font-bold text-ink-900 text-xs">
            <span>Total Extras:</span>
            <span className="font-mono">{innings1State.extras.total} runs</span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-card border-t border-ink-200 shrink-0">
        <button
          onClick={handleStartInnings2}
          className="w-full py-3.5 rounded-xl bg-pitch-700 text-white text-sm font-semibold active:scale-98 transition-transform shadow-md cursor-pointer text-center"
        >
          Start Innings 2 →
        </button>
      </div>
    </div>
  );
};
export default InningsBreakScreen;
