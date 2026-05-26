import React from 'react';
import { MatchDerivedState, Player } from '../../../engine/types';
import { formatOvers } from '../../../engine/scoring';
import { calculateEconomyRate } from '../../../engine/calculations';

interface BowlerStripProps {
  derivedState: MatchDerivedState;
}

export const BowlerStrip: React.FC<BowlerStripProps> = ({ derivedState }) => {
  const { currentInningsState, match } = derivedState;

  if (!currentInningsState) return null;

  const { activeBowlerId, bowlerStats } = currentInningsState;

  // Find players map for names
  const playersMap: Record<string, Player> = {};
  match.teams.forEach(team => {
    team.players.forEach(p => {
      playersMap[p.id] = p;
    });
  });

  const activeBowler = activeBowlerId ? playersMap[activeBowlerId] : null;
  const stats = activeBowlerId ? bowlerStats[activeBowlerId] : null;

  const isHundred = match.format === 'Hundred';

  // Format bowler figures
  const legalBalls = stats ? stats.legalDeliveries : 0;
  const oversStr = formatOvers(legalBalls, isHundred);
  const runs = stats ? stats.runsConceded : 0;
  const wickets = stats ? stats.wickets : 0;
  const maidens = stats ? stats.maidens : 0;

  const econ = calculateEconomyRate(runs, legalBalls);

  // Bowling figures string: Overs-Maidens-Runs-Wickets
  const figures = `${oversStr}–${maidens}–${runs}–${wickets}`;

  return (
    <div className="bg-ink-100 border border-ink-200 rounded-xl px-3 py-2 flex items-center justify-between mx-4 mt-2 select-none h-11">
      <div className="flex items-center gap-2 min-w-0">
        {/* Clean vector cricket ball SVG */}
        <svg className="w-4 h-4 shrink-0 shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="var(--red-600)" stroke="var(--red-700)" strokeWidth="1"/>
          {/* Seam line */}
          <path d="M12 2C12 2 15 7 15 12C15 17 12 22 12 22" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeDasharray="2.5 1.5"/>
          <path d="M12 2C12 2 9 7 9 12C9 17 12 22 12 22" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeDasharray="2.5 1.5"/>
        </svg>
        <span className="font-bold text-ink-900 text-sm truncate">
          {activeBowler ? activeBowler.name : 'Select Bowler'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold text-ink-700">
        {stats && (
          <div className="font-mono text-ink-900 tracking-tight tabular-nums">
            {figures}
          </div>
        )}
        <div className="font-mono text-ink-400">
          Econ: <span className="font-bold text-ink-700">{econ.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
