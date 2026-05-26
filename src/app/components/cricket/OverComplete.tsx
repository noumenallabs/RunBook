import React, { useState, useEffect } from 'react';
import { MatchDerivedState, Player } from '../../../engine/types';
import { verifyBowlerEligibility } from '../../../engine/validation';
import { formatOvers } from '../../../engine/scoring';
import { BallDot } from './BallDot';

interface OverCompleteProps {
  isOpen: boolean;
  onConfirm: (bowlerId: string) => void;
  onUndo?: () => void;
  derivedState: MatchDerivedState;
}

export const OverComplete: React.FC<OverCompleteProps> = ({
  isOpen,
  onConfirm,
  onUndo,
  derivedState,
}) => {
  const { currentInningsState, match, currentInningsIndex } = derivedState;
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Reset selected bowler when opening
    setSelectedBowlerId('');
    setIsSubmitting(false);
  }, [isOpen]);

  // C8: Escape key handler and focus management
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onUndo) {
          // If escape is pressed on over complete, trigger undo to go back to scoring screen
          onUndo();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onUndo]);

  if (!isOpen || !currentInningsState) return null;

  const isHundred = match.format === 'Hundred';
  const ballsPerOver = isHundred ? 5 : 6;
  const { legalBallsCount } = currentInningsState;

  // Retrieve current active deliveries
  const currentInnings = match.innings[currentInningsIndex];
  const deliveries = currentInnings ? currentInnings.deliveries : [];

  // Determine the over that just finished
  const completedOverNumber = Math.max(0, Math.floor(legalBallsCount / ballsPerOver) - 1);
  const overDeliveries = deliveries.filter(d => d.overNumber === completedOverNumber);

  // Calculate runs and wickets in this completed over
  let overRuns = 0;
  let overWickets = 0;
  let overWidesCount = 0;
  let overNoBallsCount = 0;

  overDeliveries.forEach(d => {
    if (d.wicket) overWickets++;
    
    if (d.deliveryType === 'wide') {
      overRuns += 1 + d.runs; // penalty + runs
      overWidesCount++;
    } else if (d.deliveryType === 'no_ball') {
      overRuns += 1 + d.runs; // penalty + runs
      overNoBallsCount++;
    } else {
      overRuns += d.runs;
    }
  });

  const fieldingTeam = match.teams[currentInningsState.battingTeamIndex === 0 ? 1 : 0];

  // Build summary text
  const extrasList: string[] = [];
  if (overWidesCount > 0) extrasList.push(`${overWidesCount} Wd`);
  if (overNoBallsCount > 0) extrasList.push(`${overNoBallsCount} Nb`);
  const extrasStr = extrasList.length > 0 ? ` (${extrasList.join(', ')})` : '';
  const summaryText = `${overRuns} runs${overWickets > 0 ? `, ${overWickets} W` : ''}${extrasStr}`;

  const handleConfirm = () => {
    if (selectedBowlerId && !isSubmitting) {
      setIsSubmitting(true);
      onConfirm(selectedBowlerId);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_150ms_ease] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Over Complete Bowler Selection Dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55" onClick={onUndo} />

      {/* Modal Card */}
      <div className="relative w-full max-w-[340px] bg-card rounded-2xl shadow-2xl overflow-hidden animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10 select-none flex flex-col max-h-[75vh]">
        {/* Banner Section */}
        <div className="bg-pitch-100 px-4 py-3 shrink-0">
          <div className="text-[11px] uppercase tracking-wider text-pitch-700 font-black">
            {isHundred ? `Set ${completedOverNumber + 1} Complete` : `Over ${completedOverNumber + 1} Complete`}
          </div>
          <div className="text-[15px] text-ink-900 mt-0.5 font-medium">
            <span className="font-black tabular-nums">{summaryText}</span>
          </div>
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
            {overDeliveries.map((d) => (
              <BallDot key={d.id} d={d} size={28} />
            ))}
          </div>
        </div>

        {/* Bowlers List Section */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-ink-400 font-bold mb-2 block border-b border-ink-100 pb-1">
            Select Next Bowler
          </span>
          <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-[160px]">
            {fieldingTeam.players.map(bowler => {
              const eligibility = verifyBowlerEligibility({
                bowlerId: bowler.id,
                match,
                inningsState: currentInningsState,
              });

              // Retrieve figures
              const stats = currentInningsState.bowlerStats[bowler.id];
              const bLegal = stats ? stats.legalDeliveries : 0;
              const bRuns = stats ? stats.runsConceded : 0;
              const bWickets = stats ? stats.wickets : 0;
              const bMaidens = stats ? stats.maidens : 0;
              const figs = `${formatOvers(bLegal, isHundred)}–${bMaidens}–${bRuns}–${bWickets}`;

              const active = selectedBowlerId === bowler.id;
              const disabled = !eligibility.eligible;

              return (
                <button
                  key={bowler.id}
                  disabled={disabled}
                  onClick={() => setSelectedBowlerId(bowler.id)}
                  className={`w-full flex items-center justify-between h-12 px-3 rounded-xl border text-left cursor-pointer transition-all ${
                    disabled
                      ? 'bg-ink-50 border-ink-100 opacity-50 cursor-not-allowed'
                      : active
                        ? 'bg-pitch-100 border-pitch-700 ring-1 ring-pitch-700'
                        : 'bg-card border-ink-200 hover:border-pitch-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar Initials */}
                    <div className="w-7 h-7 rounded-full bg-pitch-100 text-pitch-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {bowler.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${active ? 'text-pitch-700 font-extrabold' : 'text-ink-900'}`}>
                        {bowler.name}
                      </div>
                      <div className="text-[10px] font-semibold text-ink-400 font-mono tracking-tight mt-0.5 tabular-nums">
                        {figs}
                      </div>
                    </div>
                  </div>

                  {/* Status tags */}
                  {disabled && eligibility.reason && (
                    <span className="text-[9px] text-red-600 font-bold bg-red-50 border border-red-200 rounded px-1 max-w-[100px] truncate leading-none py-0.5">
                      {eligibility.reason.includes('previous') ? 'Prev Bowler' : 'Limit Reached'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 shrink-0 flex flex-col gap-2.5 border-t border-ink-100 pt-3">
            <button
              disabled={!selectedBowlerId || isSubmitting}
              onClick={handleConfirm}
              className="w-full h-11 rounded-xl bg-pitch-700 text-white font-bold text-sm hover:bg-pitch-600 active:scale-98 transition-all disabled:bg-ink-200 disabled:text-ink-400 disabled:scale-100 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving Over...
                </span>
              ) : (
                'Confirm Bowler'
              )}
            </button>

            {/* M9: Undo Last Ball escape hatch */}
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer text-center py-1"
              >
                Undo Last Ball (Cancel Over Complete)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default OverComplete;
