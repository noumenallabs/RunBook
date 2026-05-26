import React from 'react';
import { MatchDerivedState, Player } from '../../../engine/types';
import { calculateStrikeRate } from '../../../engine/calculations';

interface PartnershipCardProps {
  derivedState: MatchDerivedState;
}

export const PartnershipCard: React.FC<PartnershipCardProps> = ({ derivedState }) => {
  const { currentInningsState, match } = derivedState;

  if (!currentInningsState) return null;

  const { activeStrikerId, activeNonStrikerId, batterStats, currentPartnership } = currentInningsState;

  // Find players map for names
  const playersMap: Record<string, Player> = {};
  match.teams.forEach(team => {
    team.players.forEach(p => {
      playersMap[p.id] = p;
    });
  });

  const striker = activeStrikerId ? playersMap[activeStrikerId] : null;
  const nonStriker = activeNonStrikerId ? playersMap[activeNonStrikerId] : null;

  const strikerStats = activeStrikerId ? batterStats[activeStrikerId] : null;
  const nonStrikerStats = activeNonStrikerId ? batterStats[activeNonStrikerId] : null;

  const strikerSR = strikerStats ? calculateStrikeRate(strikerStats.runs, strikerStats.balls) : 0;
  const nonStrikerSR = nonStrikerStats ? calculateStrikeRate(nonStrikerStats.runs, nonStrikerStats.balls) : 0;

  return (
    <div className="bg-card border border-ink-200 rounded-xl p-3 shadow-sm select-none mx-4 mt-3">
      {/* 2-Column Batters View */}
      <div className="flex divide-x divide-ink-200">
        {/* Striker Column */}
        <div className="flex-1 pr-3 flex flex-col justify-between h-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-pitch-700 animate-pulse shrink-0"></span>
            <span className="font-bold text-ink-900 text-sm truncate">
              {striker ? striker.shortName : 'Select Striker'} *
            </span>
          </div>
          <div className="font-mono text-[11px] text-ink-700 flex items-baseline gap-2 mt-1">
            <span className="text-sm font-bold text-ink-900">
              {strikerStats ? strikerStats.runs : 0}
            </span>
            <span className="text-ink-400">
              ({strikerStats ? strikerStats.balls : 0}b)
            </span>
            <span className="text-[10px] text-ink-400 font-sans ml-auto">
              SR: {strikerSR.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Non-Striker Column */}
        <div className="flex-1 pl-3 flex flex-col justify-between h-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-ink-200 shrink-0"></span>
            <span className="font-semibold text-ink-700 text-sm truncate">
              {nonStriker ? nonStriker.shortName : 'Select Non-Striker'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-ink-700 flex items-baseline gap-2 mt-1">
            <span className="text-sm font-bold text-ink-700">
              {nonStrikerStats ? nonStrikerStats.runs : 0}
            </span>
            <span className="text-ink-400">
              ({nonStrikerStats ? nonStrikerStats.balls : 0}b)
            </span>
            <span className="text-[10px] text-ink-400 font-sans ml-auto">
              SR: {nonStrikerSR.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Partnership Row */}
      {currentPartnership && (
        <div className="border-t border-ink-100 mt-2 pt-1.5 flex items-center justify-between text-xs text-ink-700 font-medium">
          <span>Current Partnership</span>
          <span className="font-mono">
            <strong>{currentPartnership.runs}</strong> runs ({currentPartnership.balls} balls)
          </span>
        </div>
      )}
    </div>
  );
};
