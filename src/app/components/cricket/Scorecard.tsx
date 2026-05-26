import React, { useState } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { Player, InningsState, Match } from '../../../engine/types';
import { formatOvers } from '../../../engine/scoring';
import { calculateStrikeRate, calculateEconomyRate } from '../../../engine/calculations';

type TabType = 'batting' | 'bowling' | 'fow' | 'extras';

export const Scorecard: React.FC = () => {
  const nav = useNav();
  const { derivedState } = useMatch();
  
  const [activeInningsTab, setActiveInningsTab] = useState<0 | 1>(0);
  const [activeDetailsTab, setActiveDetailsTab] = useState<TabType>('batting');

  if (!derivedState) {
    return (
      <div className="flex flex-col h-full bg-ink-50 items-center justify-center">
        <span className="text-sm font-semibold text-ink-700">No active scorecard</span>
      </div>
    );
  }

  const { match, inningsStates } = derivedState;

  // Toggle active innings tab based on availability
  const hasSecondInnings = inningsStates.length >= 2;

  const currentInningsState = inningsStates[activeInningsTab];

  if (!currentInningsState) {
    return (
      <div className="flex flex-col h-full bg-ink-50">
        {/* Header */}
        <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center justify-between shrink-0">
          <button onClick={() => nav.back()} className="text-sm font-semibold text-ink-700 hover:text-ink-900 cursor-pointer">
            Back
          </button>
          <span className="text-base font-bold text-ink-900">Scorecard</span>
          <div className="w-10"></div>
        </div>

        {/* Tab selection */}
        {hasSecondInnings && (
          <div className="flex p-2 bg-card border-b border-ink-200 shrink-0">
            <div className="flex bg-ink-50 p-0.5 rounded-lg border border-ink-100 flex-1">
              <button
                onClick={() => setActiveInningsTab(0)}
                className={`flex-1 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeInningsTab === 0 ? 'bg-pitch-700 text-white' : 'text-ink-700 hover:bg-ink-100'
                }`}
              >
                1st Innings
              </button>
              <button
                onClick={() => setActiveInningsTab(1)}
                className={`flex-1 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeInningsTab === 1 ? 'bg-pitch-700 text-white' : 'text-ink-700 hover:bg-ink-100'
                }`}
              >
                2nd Innings
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-4 text-center select-none text-xs text-ink-400 font-medium">
          Innings data is not available yet. Start the innings first!
        </div>
      </div>
    );
  }

  const battingTeam = match.teams[currentInningsState.battingTeamIndex];
  const fieldingTeam = match.teams[currentInningsState.battingTeamIndex === 0 ? 1 : 0];

  // Helper mapper for player map lookup
  const playersMap: Record<string, Player> = {};
  match.teams.forEach(t => t.players.forEach(p => { playersMap[p.id] = p; }));

  // Find players who Did Not Bat (DNB)
  const battedIds = Object.keys(currentInningsState.batterStats);
  const dnbPlayers = battingTeam.players.filter(p => !battedIds.includes(p.id));

  const isHundred = match.format === 'Hundred';

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
        <span className="text-base font-bold text-ink-900">Scorecard</span>
        <div className="w-10"></div> {/* spacer */}
      </div>

      {/* Row 1: Innings selector tabs (if 2 innings exist) */}
      {hasSecondInnings && (
        <div className="flex p-2 bg-card border-b border-ink-200 shrink-0">
          <div className="flex bg-ink-50 p-0.5 rounded-lg border border-ink-100 flex-1">
            <button
              onClick={() => setActiveInningsTab(0)}
              className={`flex-1 py-1.5 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                activeInningsTab === 0 ? 'bg-pitch-700 text-white shadow-sm' : 'text-ink-700 hover:bg-ink-100'
              }`}
            >
              {match.teams[0].shortName} Innings
            </button>
            <button
              onClick={() => setActiveInningsTab(1)}
              className={`flex-1 py-1.5 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                activeInningsTab === 1 ? 'bg-pitch-700 text-white shadow-sm' : 'text-ink-700 hover:bg-ink-100'
              }`}
            >
              {match.teams[1].shortName} Innings
            </button>
          </div>
        </div>
      )}

      {/* Row 2: Tab Bar for Batting, Bowling, FoW, Extras */}
      <div className="flex border-b border-ink-200 bg-card px-2 py-1 shrink-0 overflow-x-auto no-scrollbar gap-1.5 justify-between">
        {(['batting', 'bowling', 'fow', 'extras'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveDetailsTab(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
              activeDetailsTab === tab
                ? 'bg-pitch-100 text-pitch-700 border border-pitch-700/20'
                : 'text-ink-700 hover:bg-ink-50'
            }`}
          >
            {tab === 'fow' ? 'Fall of Wkts' : tab}
          </button>
        ))}
      </div>

      {/* Main Details Panel */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeDetailsTab === 'batting' && (
          <div className="bg-card border border-ink-200 rounded-2xl shadow-sm overflow-hidden space-y-3 p-3">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-ink-200 font-bold text-ink-400 uppercase tracking-wider h-8">
                  <th className="pr-2">Batter</th>
                  <th className="text-center w-10">R</th>
                  <th className="text-center w-10">B</th>
                  <th className="text-center w-8">4s</th>
                  <th className="text-center w-8">6s</th>
                  <th className="text-right w-14">SR</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(currentInningsState.batterStats).map(stats => {
                  const player = playersMap[stats.playerId];
                  const active = currentInningsState.activeStrikerId === stats.playerId || currentInningsState.activeNonStrikerId === stats.playerId;

                  return (
                    <tr key={stats.playerId} className="border-b border-ink-100 h-12 select-none">
                      <td className="pr-2 py-1 min-w-[120px]">
                        <span className={`font-bold block truncate max-w-[140px] ${active ? 'text-pitch-700' : 'text-ink-900'}`}>
                          {player ? player.name : 'Unknown Batter'}
                          {active && ' *'}
                        </span>
                        <span className="text-[10px] text-ink-400 italic block mt-0.5 truncate max-w-[150px]">
                          {stats.dismissalDescription || (active ? 'batting' : 'not out')}
                        </span>
                      </td>
                      <td className="text-center font-mono font-bold text-ink-900 tabular-nums">{stats.runs}</td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">{stats.balls}</td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">{stats.fours}</td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">{stats.sixes}</td>
                      <td className="text-right font-mono text-ink-700 tabular-nums">
                        {calculateStrikeRate(stats.runs, stats.balls).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {/* Extras Details row */}
            <div className="border-t border-ink-200 pt-2 text-xs flex justify-between items-center text-ink-700 font-semibold select-none">
              <span>Extras</span>
              <span className="font-mono text-ink-900 font-bold tabular-nums">
                {currentInningsState.extras.total}
                <span className="text-[10px] text-ink-400 font-medium font-sans ml-1">
                  (Wd:{currentInningsState.extras.wides}, Nb:{currentInningsState.extras.noBalls}, B:{currentInningsState.extras.byes}, Lb:{currentInningsState.extras.legByes})
                </span>
              </span>
            </div>

            {/* Total score summary */}
            <div className="border-t border-ink-200 pt-2 flex justify-between items-center font-bold text-sm text-pitch-700 select-none">
              <span>Total Score</span>
              <span className="font-mono">
                {match.scoreConvention === 'runs_wickets' 
                  ? `${currentInningsState.score}/${currentInningsState.wickets}` 
                  : `${currentInningsState.wickets}/${currentInningsState.score}`}
                <span className="text-xs text-ink-400 font-medium font-sans ml-1.5">
                  ({formatOvers(currentInningsState.legalBallsCount, isHundred)} Ov)
                </span>
              </span>
            </div>

            {/* Did Not Bat (DNB) List */}
            {dnbPlayers.length > 0 && (
              <div className="border-t border-ink-100 pt-2 select-none">
                <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider block mb-1">
                  Did Not Bat
                </span>
                <p className="text-xs text-ink-600 italic">
                  {dnbPlayers.map(p => p.name).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {activeDetailsTab === 'bowling' && (
          <div className="bg-card border border-ink-200 rounded-2xl shadow-sm overflow-hidden p-3">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-ink-200 font-bold text-ink-400 uppercase tracking-wider h-8">
                  <th className="pr-2">Bowler</th>
                  <th className="text-center w-8">O</th>
                  <th className="text-center w-8">M</th>
                  <th className="text-center w-8">R</th>
                  <th className="text-center w-8">W</th>
                  <th className="text-center w-8">Wd</th>
                  <th className="text-center w-8">Nb</th>
                  <th className="text-right w-12">Econ</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(currentInningsState.bowlerStats).map(stats => {
                  const player = playersMap[stats.playerId];
                  const active = currentInningsState.activeBowlerId === stats.playerId;

                  return (
                    <tr key={stats.playerId} className="border-b border-ink-100 h-12 select-none">
                      <td className="pr-2 py-1 font-bold text-ink-900 truncate max-w-[100px]">
                        {player ? player.name : 'Unknown Bowler'}
                        {active && ' *'}
                      </td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">
                        {formatOvers(stats.legalDeliveries, isHundred)}
                      </td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">{stats.maidens}</td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">{stats.runsConceded}</td>
                      <td className="text-center font-mono font-bold text-ink-900 tabular-nums">{stats.wickets}</td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">{stats.wides}</td>
                      <td className="text-center font-mono text-ink-700 tabular-nums">{stats.noBalls}</td>
                      <td className="text-right font-mono text-ink-700 tabular-nums">
                        {calculateEconomyRate(stats.runsConceded, stats.legalDeliveries, isHundred).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                {Object.values(currentInningsState.bowlerStats).length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-ink-400 font-medium italic">
                      No bowlers logged for this innings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {activeDetailsTab === 'fow' && (
          <div className="bg-card border border-ink-200 rounded-2xl shadow-sm p-4 space-y-3">
            <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider block border-b border-ink-100 pb-1.5 select-none">
              Fall of Wickets Timeline
            </span>

            <div className="space-y-3">
              {currentInningsState.fallOfWickets.map(fow => {
                const batter = playersMap[fow.batterId];
                const batterName = batter ? batter.shortName : 'Batter';

                return (
                  <div key={fow.wicketNumber} className="flex items-center text-xs font-semibold text-ink-700 select-none">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center font-mono shrink-0 mr-3">
                      {fow.wicketNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-ink-900 font-bold block truncate">
                        {fow.score}/{fow.wicketNumber}
                      </span>
                      <span className="text-[10px] text-ink-400 font-medium block">
                        Dismissed: {batterName} ({fow.overs} Ov)
                      </span>
                    </div>
                  </div>
                );
              })}

              {currentInningsState.fallOfWickets.length === 0 && (
                <div className="text-center py-6 text-ink-400 font-medium italic">
                  No wickets fallen in this innings.
                </div>
              )}
            </div>
          </div>
        )}

        {activeDetailsTab === 'extras' && (
          <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-4 select-none">
            <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider block border-b border-ink-100 pb-2">
              Extras Detailed Ledger
            </span>

            <div className="space-y-3 font-semibold text-xs text-ink-700">
              <div className="flex justify-between border-b border-ink-100 pb-2">
                <div>
                  <span className="text-ink-900 block font-bold">Wides (Wd)</span>
                  <span className="text-[10px] text-ink-400 block font-medium">Penalty run + extra byes off wide</span>
                </div>
                <span className="font-mono text-ink-900 text-sm font-bold tabular-nums">
                  {currentInningsState.extras.wides} runs
                </span>
              </div>

              <div className="flex justify-between border-b border-ink-100 pb-2">
                <div>
                  <span className="text-ink-900 block font-bold">No-Balls (Nb)</span>
                  <span className="text-[10px] text-ink-400 block font-medium">Penalty 1 run for illegal delivery</span>
                </div>
                <span className="font-mono text-ink-900 text-sm font-bold tabular-nums">
                  {currentInningsState.extras.noBalls} runs
                </span>
              </div>

              <div className="flex justify-between border-b border-ink-100 pb-2">
                <div>
                  <span className="text-ink-900 block font-bold">Byes (B)</span>
                  <span className="text-[10px] text-ink-400 block font-medium">Missed bat and keeper, batters ran</span>
                </div>
                <span className="font-mono text-ink-900 text-sm font-bold tabular-nums">
                  {currentInningsState.extras.byes} runs
                </span>
              </div>

              <div className="flex justify-between border-b border-ink-100 pb-2">
                <div>
                  <span className="text-ink-900 block font-bold">Leg-Byes (Lb)</span>
                  <span className="text-[10px] text-ink-400 block font-medium">Hit pad/body, batters ran</span>
                </div>
                <span className="font-mono text-ink-900 text-sm font-bold tabular-nums">
                  {currentInningsState.extras.legByes} runs
                </span>
              </div>

              <div className="flex justify-between pb-2">
                <div>
                  <span className="text-ink-900 block font-bold">Conduct Penalties</span>
                  <span className="text-[10px] text-ink-400 block font-medium">Awarded for infractions</span>
                </div>
                <span className="font-mono text-ink-900 text-sm font-bold tabular-nums">
                  {currentInningsState.extras.penalty} runs
                </span>
              </div>
            </div>

            <div className="border-t-2 border-ink-200 pt-3 flex justify-between items-center text-sm font-bold text-pitch-700">
              <span>Aggregate Extras</span>
              <span className="font-mono font-black tabular-nums">
                {currentInningsState.extras.total} runs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Scorecard;
