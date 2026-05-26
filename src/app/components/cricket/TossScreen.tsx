import React, { useState } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { ScorecardEvent, Match } from '../../../engine/types';
import { toast } from 'sonner';

export const TossScreen: React.FC = () => {
  const nav = useNav();
  const { derivedState, dispatch, startNewMatch } = useMatch();

  const [tossWinnerId, setTossWinnerId] = useState<string>('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [flipResult, setFlipResult] = useState<'HEADS' | 'TAILS' | ''>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  if (!derivedState) return null;

  const { match } = derivedState;
  const teamA = match.teams[0];
  const teamB = match.teams[1];

  const handleFlip = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setFlipResult('');
    
    // Simulate coin spinning for 1.2s
    let ticks = 0;
    const interval = setInterval(() => {
      setFlipResult(Math.random() > 0.5 ? 'HEADS' : 'TAILS');
      ticks++;
      if (ticks > 8) {
        clearInterval(interval);
        const finalResult = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
        setFlipResult(finalResult);
        setIsAnimating(false);
        setIsFlipped(true);

        // Randomly award toss winner as guidance
        const winner = Math.random() > 0.5 ? teamA : teamB;
        setTossWinnerId(winner.id);
      }
    }, 120);
  };

  const handleStartMatch = async () => {
    if (!tossWinnerId) {
      toast.error('Please select who won the toss.');
      return;
    }

    // 1. Dispatch TOSS_COMPLETE event
    await dispatch({
      type: 'TOSS_COMPLETE',
      winnerId: tossWinnerId,
      decision,
    });

    // 2. Navigate to Innings Setup Screen
    nav.go({ name: 'innings_setup' });
  };

  const handleSkipToss = () => {
    // Skip coin flip animation, just set team A as winner by default and choose
    setTossWinnerId(teamA.id);
    setIsFlipped(true);
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
          <span className="text-base font-bold text-ink-900 leading-none">Coin Toss</span>
          <span className="text-[9px] text-pitch-700 font-extrabold uppercase tracking-widest mt-1">Step 4 of 5</span>
        </div>
        <div className="w-10"></div> {/* spacer */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center space-y-6">
        {/* Coin flip graphic */}
        <div className="flex flex-col items-center gap-4">
          <div 
            onClick={handleFlip}
            className={`w-36 h-36 rounded-full border-4 border-amber-600 bg-amber-100 flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-100 cursor-pointer select-none text-2xl font-black text-amber-700 ${
              isAnimating ? 'animate-bounce' : ''
            }`}
          >
            {flipResult || 'SPIN'}
          </div>
          <span className="text-xs text-ink-400 font-semibold uppercase tracking-wider">
            {isAnimating ? 'Spinning...' : 'Tap coin to spin'}
          </span>
        </div>

        {/* Toss Winner Selector */}
        {isFlipped && (
          <div className="w-full bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-4 animate-[fadein_150ms_ease]">
            <div>
              <span className="text-xs font-bold text-ink-900 block">Who won the toss?</span>
              <span className="text-[10px] text-ink-400 font-medium block">Select the winning team</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTossWinnerId(teamA.id)}
                className={`flex-1 py-3 border rounded-xl text-sm font-semibold cursor-pointer ${
                  tossWinnerId === teamA.id
                    ? 'bg-pitch-700 border-pitch-700 text-white shadow-sm'
                    : 'bg-card text-ink-700 border-ink-200'
                }`}
              >
                {teamA.name}
              </button>
              <button
                onClick={() => setTossWinnerId(teamB.id)}
                className={`flex-1 py-3 border rounded-xl text-sm font-semibold cursor-pointer ${
                  tossWinnerId === teamB.id
                    ? 'bg-pitch-700 border-pitch-700 text-white shadow-sm'
                    : 'bg-card text-ink-700 border-ink-200'
                }`}
              >
                {teamB.name}
              </button>
            </div>

            {tossWinnerId && (
              <div className="space-y-2 pt-2 border-t border-ink-100 animate-[fadein_150ms_ease]">
                <span className="text-xs font-bold text-ink-900 block">Choose to:</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDecision('bat')}
                    className={`flex-1 py-3 border rounded-xl text-sm font-semibold cursor-pointer ${
                      decision === 'bat'
                        ? 'bg-pitch-100 border-pitch-700 text-pitch-700 font-bold'
                        : 'bg-card text-ink-700 border-ink-200'
                    }`}
                  >
                    🏏 BAT
                  </button>
                  <button
                    onClick={() => setDecision('bowl')}
                    className={`flex-1 py-3 border rounded-xl text-sm font-semibold cursor-pointer ${
                      decision === 'bowl'
                        ? 'bg-pitch-100 border-pitch-700 text-pitch-700 font-bold'
                        : 'bg-card text-ink-700 border-ink-200'
                    }`}
                  >
                    🔴 BOWL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isFlipped && (
          <button
            onClick={handleSkipToss}
            className="text-xs text-pitch-700 font-bold hover:underline cursor-pointer select-none"
          >
            Skip toss (manual selection)
          </button>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-card border-t border-ink-200 shrink-0">
        <button
          disabled={!tossWinnerId}
          onClick={handleStartMatch}
          className="w-full py-3.5 rounded-xl bg-pitch-700 text-white text-sm font-semibold active:scale-98 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:scale-100 shadow-md cursor-pointer text-center"
        >
          Start Match →
        </button>
      </div>
    </div>
  );
};
export default TossScreen;
