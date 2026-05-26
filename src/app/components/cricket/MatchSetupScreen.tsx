import React, { useState } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { FormatType, Match, Team } from '../../../engine/types';
import { generateUUID } from '../../../db/matchStore';
import { toast } from 'sonner';

export const MatchSetupScreen: React.FC = () => {
  const nav = useNav();
  const { startNewMatch } = useMatch();

  const [format, setFormat] = useState<FormatType>('T20');
  const [customOvers, setCustomOvers] = useState<number>(20);
  const [teamAName, setTeamAName] = useState<string>('Mumbai Strikers');
  const [teamBName, setTeamBName] = useState<string>('Chennai Chargers');
  const [scoreConvention, setScoreConvention] = useState<'runs_wickets' | 'wickets_runs'>('runs_wickets');
  const [powerplayOvers, setPowerplayOvers] = useState<number>(6);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync format changes with default overs and powerplay overs
  const handleFormatChange = (newFormat: FormatType) => {
    setFormat(newFormat);
    let defaultOvers = 20;
    let defaultPP = 6;

    switch (newFormat) {
      case 'T5':
        defaultOvers = 5;
        defaultPP = 1;
        break;
      case 'T10':
        defaultOvers = 10;
        defaultPP = 3;
        break;
      case 'T20':
        defaultOvers = 20;
        defaultPP = 6;
        break;
      case 'Hundred':
        defaultOvers = 20; // 100 balls / 5 = 20 sets
        defaultPP = 5; // 25 balls = 5 sets
        break;
      case 'ODI':
        defaultOvers = 50;
        defaultPP = 10;
        break;
      case 'custom':
        defaultOvers = 20;
        defaultPP = 0;
        break;
    }
    setCustomOvers(defaultOvers);
    setPowerplayOvers(defaultPP);
  };

  const handleNext = async () => {
    if (isSubmitting) return;
    if (!teamAName.trim() || !teamBName.trim()) {
      toast.error('Please enter names for both teams.');
      return;
    }
    setIsSubmitting(true);

    const totalOvers = format === 'custom' ? customOvers : (format === 'Hundred' ? 20 : customOvers);

    const teamA: Team = {
      id: generateUUID(),
      name: teamAName.trim(),
      shortName: teamAName.trim().substring(0, 3).toUpperCase(),
      players: [],
      battingOrder: [],
    };

    const teamB: Team = {
      id: generateUUID(),
      name: teamBName.trim(),
      shortName: teamBName.trim().substring(0, 3).toUpperCase(),
      players: [],
      battingOrder: [],
    };

    const newMatch: Match = {
      id: generateUUID(),
      format,
      totalOvers,
      teams: [teamA, teamB],
      state: 'SETUP',
      superOverEnabled: false,
      scoreConvention,
      powerplayOvers,
      createdAt: Date.now(),
    };

    // Save metadata and initialize
    await startNewMatch(newMatch);

    // Go to Team A Roster Screen
    nav.go({ name: 'roster', teamIndex: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center justify-between shrink-0">
        <button
          onClick={() => nav.back()}
          className="text-sm font-semibold text-ink-700 hover:text-ink-900 cursor-pointer"
        >
          Cancel
        </button>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-ink-900 leading-none">New Match Setup</span>
          <span className="text-[9px] text-pitch-700 font-extrabold uppercase tracking-widest mt-1">Step 1 of 5</span>
        </div>
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="text-sm font-bold text-pitch-700 hover:text-pitch-600 cursor-pointer disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Section 1: Match Format */}
        <div className="bg-card rounded-2xl border border-ink-200 p-4 shadow-sm space-y-3">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Match Format</span>
          <div className="flex bg-ink-50 p-1 rounded-xl border border-ink-100 flex-wrap gap-1">
            {(['T5', 'T10', 'T20', 'Hundred', 'custom'] as FormatType[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFormatChange(f)}
                className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                  format === f
                    ? 'bg-pitch-700 text-white shadow-sm'
                    : 'text-ink-700 hover:bg-ink-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Conditional custom overs input */}
          {format === 'custom' && (
            <div className="flex items-center justify-between pt-2 border-t border-ink-100 animate-[fadein_150ms_ease]">
              <span className="text-xs font-semibold text-ink-700">Custom total overs:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={customOvers}
                onChange={(e) => setCustomOvers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center font-mono font-bold bg-ink-100 border border-ink-200 rounded-lg py-1.5 focus:outline-none focus:border-pitch-700"
              />
            </div>
          )}
        </div>

        {/* Section 2: Team Names */}
        <div className="bg-card rounded-2xl border border-ink-200 p-4 shadow-sm space-y-4">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Team Info</span>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-ink-700">Team A (Batting/First Team)</label>
              <input
                type="text"
                placeholder="Team A Name"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full bg-ink-100 border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-900 font-semibold focus:outline-none focus:border-pitch-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-ink-700">Team B (Fielding/Second Team)</label>
              <input
                type="text"
                placeholder="Team B Name"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full bg-ink-100 border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-900 font-semibold focus:outline-none focus:border-pitch-700"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Scoring options */}
        <div className="bg-card rounded-2xl border border-ink-200 p-4 shadow-sm space-y-4">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Match Options</span>

          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <div>
              <span className="text-xs font-bold text-ink-900 block">Scoreboard Format</span>
              <span className="text-[10px] text-ink-400 font-medium block">How runs/wickets are displayed</span>
            </div>
            <div className="flex border border-ink-200 rounded-lg overflow-hidden font-mono text-[11px] font-bold">
              <button
                onClick={() => setScoreConvention('runs_wickets')}
                className={`px-3 py-1.5 cursor-pointer ${
                  scoreConvention === 'runs_wickets' ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                147/4
              </button>
              <button
                onClick={() => setScoreConvention('wickets_runs')}
                className={`px-3 py-1.5 cursor-pointer ${
                  scoreConvention === 'wickets_runs' ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                4/147
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink-900 block">Powerplay Limit</span>
              <span className="text-[10px] text-ink-400 font-medium block">Number of PP overs/sets</span>
            </div>
            <input
              type="number"
              min="0"
              max={format === 'custom' ? customOvers : 50}
              value={powerplayOvers}
              onChange={(e) => setPowerplayOvers(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 text-center font-mono font-bold bg-ink-100 border border-ink-200 rounded-lg py-1 focus:outline-none focus:border-pitch-700"
            />
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="p-4 bg-card border-t border-ink-200 shrink-0">
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-pitch-700 text-white text-sm font-semibold active:scale-98 transition-transform shadow-md cursor-pointer text-center disabled:bg-ink-200 disabled:text-ink-400 disabled:scale-100 flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? 'Initializing Match...' : 'Set Up Rosters →'}
        </button>
      </div>
    </div>
  );
};
export default MatchSetupScreen;
