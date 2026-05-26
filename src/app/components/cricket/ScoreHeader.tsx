import React from 'react';
import { MatchDerivedState } from '../../../engine/types';
import { calculateCurrentRunRate, calculateRequiredRunRate } from '../../../engine/calculations';

interface ScoreHeaderProps {
  derivedState: MatchDerivedState;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({ derivedState }) => {
  const { match, currentInningsState, currentInningsIndex } = derivedState;

  if (!currentInningsState) {
    return (
      <div 
        className="pt-[calc(env(safe-area-inset-top)+12px)] pb-3 px-4 min-h-[128px] bg-pitch-700 flex items-center justify-center text-white font-bold"
        role="banner"
        aria-label="Score Header Ready"
      >
        Scorecard Ready
      </div>
    );
  }

  const { score, wickets, legalBallsCount, battingTeamIndex } = currentInningsState;
  const battingTeam = match.teams[battingTeamIndex];
  const isHundred = match.format === 'Hundred';

  // Format overs string
  const ballsPerOver = isHundred ? 5 : 6;
  const oversStr = `${Math.floor(legalBallsCount / ballsPerOver)}.${legalBallsCount % ballsPerOver}`;
  const totalOvers = isHundred ? 20 : match.totalOvers; // 100 balls = 20 sets of 5

  // Hero score representation convention
  const scoreConvention = match.scoreConvention;
  const mainScoreText = scoreConvention === 'runs_wickets' 
    ? `${score}/${wickets}` 
    : `${wickets}/${score}`;

  // Rates calculation
  const crr = calculateCurrentRunRate(score, legalBallsCount, isHundred);

  // 2nd Innings Target calculation
  const isSecondInnings = currentInningsIndex === 1;
  const target = currentInningsState.target;
  let runsNeeded = 0;
  let ballsRemaining = 0;
  let rrr = 0;

  if (isSecondInnings && target) {
    runsNeeded = Math.max(0, target - score);
    const totalBallsQuota = isHundred ? 100 : match.totalOvers * 6;
    ballsRemaining = Math.max(0, totalBallsQuota - legalBallsCount);
    rrr = calculateRequiredRunRate(runsNeeded, ballsRemaining, isHundred);
  }

  // RRR amber warning condition
  const rrrWarning = isSecondInnings && rrr > crr + 2.0;

  return (
    <div 
      className="bg-pitch-700 text-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] flex flex-col justify-between min-h-[128px] select-none shadow-md"
      role="banner"
      aria-label={`Score: ${mainScoreText}. Overs: ${oversStr} of ${totalOvers}.`}
    >
      {/* Screen Reader Only Accessibility Announcement */}
      <div className="sr-only" aria-live="polite">
        {battingTeam.name} is {score} runs for {wickets} wickets after {oversStr} overs.
        {isSecondInnings && target && ` Target is ${target}. Need ${runsNeeded} runs from ${ballsRemaining} deliveries.`}
      </div>

      {/* Row 1: Team & Overs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-white text-pitch-700 px-2 py-0.5 rounded-sm font-bold text-xs uppercase shadow-sm">
            {battingTeam.shortName}
          </span>
          <span className="font-semibold text-white/90 text-sm truncate max-w-[140px]">
            {battingTeam.name}
          </span>
          {isSecondInnings && target && (
            <span className="text-xs text-white/80 font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
              Target: {target}
            </span>
          )}
        </div>
        
        {/* N1: Styled Overs Display with visual weight */}
        <div className="font-mono text-xs bg-black/20 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-sm">
          <span className="text-white/85 font-sans font-bold uppercase tracking-wider text-[10px]">Overs</span>
          <span className="font-extrabold text-white text-sm">{oversStr}</span>
          <span className="text-white/40">/</span>
          <span className="text-white/70">{totalOvers}</span>
        </div>
      </div>

      {/* Row 2: Hero Score */}
      <div className="flex items-baseline justify-between -mt-1">
        {/* C14: Increased Hero Score to 40px */}
        <div className="font-mono text-[40px] font-bold tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {mainScoreText}
        </div>
        
        {/* Status indicator on the right of the score */}
        <div className="text-[10px] font-bold text-white/85 bg-white/15 border border-white/5 px-2 py-1 rounded-md uppercase tracking-wider">
          Innings {currentInningsIndex + 1}
        </div>
      </div>

      {/* Row 3: Rates & Info Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* CRR Chip */}
        <div className="bg-white/15 px-2.5 py-0.5 rounded-full font-mono text-xs text-white flex items-center gap-1 shrink-0 border border-white/5">
          <span className="text-white/85 font-sans font-bold text-[10px]">CRR</span>
          <strong className="font-black text-white">{crr.toFixed(2)}</strong>
        </div>

        {/* 2nd Innings Chase info */}
        {isSecondInnings && target && (
          <>
            <div className={`px-2.5 py-0.5 rounded-full font-mono text-xs flex items-center gap-1 shrink-0 border ${
              rrrWarning 
                ? 'bg-amber-600 border-amber-500 text-white animate-pulse' 
                : 'bg-white/15 border-white/5 text-white'
            }`}>
              <span className="font-sans font-bold text-[10px] text-white/85">RRR</span>
              <strong className="font-black text-white">{rrr.toFixed(2)}</strong>
            </div>

            <div className="bg-white/10 border border-white/5 px-2.5 py-0.5 rounded-full text-xs text-white/95 font-semibold shrink-0">
              Need <strong>{runsNeeded}</strong> runs off <strong>{ballsRemaining}</strong> balls
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default ScoreHeader;
