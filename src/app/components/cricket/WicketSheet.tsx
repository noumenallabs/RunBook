import React, { useState, useEffect } from 'react';
import { MatchDerivedState, DismissalType, Delivery, Player } from '../../../engine/types';
import { isDismissalAllowed } from '../../../engine/validation';
import { formatDismissalText } from '../../../engine/scoring';

interface WicketSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (wicket: NonNullable<Delivery['wicket']>) => void;
  derivedState: MatchDerivedState;
  deliveryType: 'legal' | 'wide' | 'no_ball';
}

const DISMISSAL_OPTIONS: { type: DismissalType; label: string }[] = [
  { type: 'bowled', label: 'Bowled' },
  { type: 'caught', label: 'Caught' },
  { type: 'lbw', label: 'LBW' },
  { type: 'stumped', label: 'Stumped' },
  { type: 'run_out', label: 'Run Out' },
  { type: 'hit_wicket', label: 'Hit Wicket' },
  { type: 'obstructing', label: 'Obstructing' },
  { type: 'hit_twice', label: 'Hit Twice' },
  { type: 'timed_out', label: 'Timed Out' },
  { type: 'retired_out', label: 'Retired Out' },
];

export const WicketSheet: React.FC<WicketSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  derivedState,
  deliveryType,
}) => {
  const { currentInningsState, match, currentInningsIndex } = derivedState;

  const [batterId, setBatterId] = useState<string>('');
  const [dismissalType, setDismissalType] = useState<DismissalType>('bowled');
  const [fielderId, setFielderId] = useState<string>('');
  const [fielderEnd, setFielderEnd] = useState<'striker' | 'non_striker'>('striker');
  const [runsBefore, setRunsBefore] = useState<number>(0);
  const [crossed, setCrossed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Determine if next ball is a free hit
  let isFreeHit = false;
  const activeInnings = match.innings[currentInningsIndex];
  if (activeInnings && activeInnings.deliveries.length > 0) {
    const lastDel = activeInnings.deliveries[activeInnings.deliveries.length - 1];
    if (lastDel.deliveryType === 'no_ball') {
      isFreeHit = true;
    } else if (lastDel.isFreeHit && (lastDel.deliveryType === 'wide' || lastDel.deliveryType === 'no_ball')) {
      isFreeHit = true;
    }
  }

  // C8: Escape key handler and focus management
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Sync initial state when drawer opens
  useEffect(() => {
    if (currentInningsState && isOpen) {
      setBatterId(currentInningsState.activeStrikerId || '');
      
      // Select first allowed dismissal type
      const firstAllowed = DISMISSAL_OPTIONS.find(opt => 
        isDismissalAllowed({ dismissalType: opt.type, deliveryType, isFreeHit }).allowed
      );
      setDismissalType(firstAllowed ? firstAllowed.type : 'bowled');

      // Pre-fill wicket keeper as default fielder for stumped
      const fieldingTeam = match.teams[currentInningsState.battingTeamIndex === 0 ? 1 : 0];
      const keeper = fieldingTeam.players.find(p => p.isKeeper);
      setFielderId(keeper ? keeper.id : '');
      
      // Reset other states
      setFielderEnd('striker');
      setRunsBefore(0);
      setCrossed(false);
    }
  }, [isOpen, currentInningsState, deliveryType, isFreeHit, match.teams]);

  if (!isOpen || !currentInningsState) return null;

  const battingTeam = match.teams[currentInningsState.battingTeamIndex];
  const fieldingTeam = match.teams[currentInningsState.battingTeamIndex === 0 ? 1 : 0];

  const striker = currentInningsState.activeStrikerId ? battingTeam.players.find(p => p.id === currentInningsState.activeStrikerId) : null;
  const nonStriker = currentInningsState.activeNonStrikerId ? battingTeam.players.find(p => p.id === currentInningsState.activeNonStrikerId) : null;

  const needsFielder = dismissalType === 'caught' || dismissalType === 'run_out' || dismissalType === 'stumped';

  const handleConfirm = () => {
    if (!batterId || isSubmitting) return;

    setIsSubmitting(true);
    onConfirm({
      type: dismissalType,
      batterId,
      fielderId: needsFielder && fielderId ? fielderId : undefined,
      fielderEnd: dismissalType === 'run_out' ? fielderEnd : undefined,
      runsBefore: dismissalType === 'run_out' ? runsBefore : undefined,
      crossed: (dismissalType === 'caught' || dismissalType === 'run_out') ? crossed : undefined,
    });
  };

  // Generate natural language preview
  const playersMap: Record<string, Player> = {};
  match.teams.forEach(t => t.players.forEach(p => { playersMap[p.id] = p; }));
  
  const selectedBatterName = playersMap[batterId]?.name || 'Batter';
  const activeBowler = currentInningsState.activeBowlerId ? playersMap[currentInningsState.activeBowlerId] : null;
  const activeBowlerName = activeBowler ? activeBowler.shortName : 'Bowler';

  const previewText = formatDismissalText(
    {
      type: dismissalType,
      batterId,
      fielderId: fielderId || undefined,
      fielderEnd: dismissalType === 'run_out' ? fielderEnd : undefined,
      runsBefore: dismissalType === 'run_out' ? runsBefore : undefined,
      crossed,
    },
    activeBowlerName,
    playersMap
  );

  const isBowlerCredited = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket', 'hit_twice'].includes(dismissalType);

  return (
    <div 
      className="fixed inset-0 flex items-end justify-center z-50 animate-[fadein_150ms_ease]"
      role="dialog"
      aria-modal="true"
      aria-label="Wicket Details Input Sheet"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Content Sheet - M8 constrained height to max-h-[70vh] */}
      <div className="relative w-full max-w-md bg-card rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden pb-6 animate-[slideup_220ms_cubic-bezier(0.2,0,0,1)] z-10 flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-ink-200" />
        </div>

        <div className="px-4 flex items-center justify-between border-b border-ink-100 pb-3 shrink-0">
          <span className="text-base font-bold text-ink-900">Record Wicket</span>
          <button
            onClick={onClose}
            autoFocus // C8 focus management: autoFocus on close button so focus doesn't stay in background
            className="text-sm text-ink-400 hover:text-ink-700 font-semibold uppercase cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Section 1: Who's out? */}
          <div>
            <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-2">Who is out?</span>
            <div className="flex gap-3">
              {striker && (
                <button
                  onClick={() => setBatterId(striker.id)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold cursor-pointer ${
                    batterId === striker.id
                      ? 'bg-pitch-700 text-white border-pitch-700 shadow-sm'
                      : 'bg-card text-ink-700 border-ink-200'
                  }`}
                >
                  {striker.shortName} (Striker)
                </button>
              )}
              {nonStriker && (
                <button
                  onClick={() => setBatterId(nonStriker.id)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold cursor-pointer ${
                    batterId === nonStriker.id
                      ? 'bg-pitch-700 text-white border-pitch-700 shadow-sm'
                      : 'bg-card text-ink-700 border-ink-200'
                  }`}
                >
                  {nonStriker.shortName} (Non-Striker)
                </button>
              )}
            </div>
          </div>

          {/* Section 2: How? M7: Changed from horizontal scroll to beautiful grid wrap */}
          <div>
            <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-2">Dismissal Method</span>
            <div className="grid grid-cols-3 gap-1.5">
              {DISMISSAL_OPTIONS.map(opt => {
                const eligibility = isDismissalAllowed({ dismissalType: opt.type, deliveryType, isFreeHit });
                const active = dismissalType === opt.type;

                return (
                  <button
                    key={opt.type}
                    onClick={() => {
                      setDismissalType(opt.type);
                      // Clear fielder selection if not needed
                      if (opt.type !== 'stumped' && opt.type !== 'caught' && opt.type !== 'run_out') {
                        setFielderId('');
                      } else if (opt.type === 'stumped') {
                        const keeper = fieldingTeam.players.find(p => p.isKeeper);
                        setFielderId(keeper ? keeper.id : '');
                      }
                    }}
                    disabled={!eligibility.allowed}
                    className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors text-center ${
                      active
                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                        : eligibility.allowed
                          ? 'bg-card text-ink-700 border-ink-200 hover:bg-ink-100'
                          : 'bg-ink-50 text-ink-300 border-ink-100 cursor-not-allowed opacity-50'
                    }`}
                    title={eligibility.reason}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Conditional Fielder Choice - M15: Expanded fielder buttons to 44px min height */}
          {needsFielder && (
            <div>
              <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-2">
                {dismissalType === 'stumped' ? 'Wicket Keeper (stumper)' : dismissalType === 'caught' ? 'Caught by' : 'Fielder involved'}
              </span>
              <div className="grid grid-cols-3 gap-2 max-h-[140px] overflow-y-auto p-1 border border-ink-100 rounded-xl bg-ink-50">
                {fieldingTeam.players.map(fielder => (
                  <button
                    key={fielder.id}
                    onClick={() => setFielderId(fielder.id)}
                    className={`py-3 px-2 rounded-xl border text-xs text-center truncate cursor-pointer min-h-[44px] flex items-center justify-center font-semibold ${
                      fielderId === fielder.id
                        ? 'bg-pitch-100 text-pitch-700 border-pitch-700 font-black shadow-inner'
                        : 'bg-card text-ink-700 border-ink-200 hover:bg-ink-100 shadow-sm'
                    }`}
                  >
                    <span>{fielder.shortName}</span>
                    {fielder.isKeeper && <span className="text-[9px] bg-pitch-700 text-white rounded px-0.5 ml-1 font-black shrink-0">WK</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Extra Run Out Configurations */}
          {dismissalType === 'run_out' && (
            <div className="bg-ink-50 p-3 rounded-xl border border-ink-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-700">Runs completed before run-out:</span>
                <div className="flex items-center border border-ink-200 rounded-lg bg-card overflow-hidden">
                  {[0, 1, 2, 3].map(runs => (
                    <button
                      key={runs}
                      onClick={() => setRunsBefore(runs)}
                      className={`px-3 py-1 font-mono text-xs font-bold border-r border-ink-200 last:border-0 cursor-pointer ${
                        runsBefore === runs ? 'bg-pitch-700 text-white' : 'text-ink-700 hover:bg-ink-50'
                      }`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-700">Wicket fell at which end:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFielderEnd('striker')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      fielderEnd === 'striker' ? 'bg-pitch-700 text-white border-pitch-700' : 'bg-card text-ink-700 border-ink-200'
                    }`}
                  >
                    Striker End
                  </button>
                  <button
                    onClick={() => setFielderEnd('non_striker')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      fielderEnd === 'non_striker' ? 'bg-pitch-700 text-white border-pitch-700' : 'bg-card text-ink-700 border-ink-200'
                    }`}
                  >
                    Non-Striker End
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-700">Batters crossed during run-out:</span>
                <button
                  onClick={() => setCrossed(!crossed)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    crossed ? 'bg-pitch-100 text-pitch-700 border-pitch-700' : 'bg-card text-ink-400 border-ink-200'
                  }`}
                >
                  {crossed ? 'Yes, Crossed' : 'No'}
                </button>
              </div>
            </div>
          )}

          {/* Section 5: Caught Cross Configuration */}
          {dismissalType === 'caught' && (
            <div className="flex items-center justify-between bg-ink-50 p-3 rounded-xl border border-ink-100">
              <span className="text-xs font-semibold text-ink-700">Batters crossed before catch:</span>
              <button
                onClick={() => setCrossed(!crossed)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  crossed ? 'bg-pitch-100 text-pitch-700 border-pitch-700' : 'bg-card text-ink-400 border-ink-200'
                }`}
              >
                {crossed ? 'Yes, Crossed' : 'No'}
              </button>
            </div>
          )}

          {/* Natural Language Preview Container */}
          <div className="rounded-xl bg-amber-100 border border-amber-600/20 p-3 shrink-0">
            <div className="text-sm font-semibold text-ink-900 capitalize">
              {selectedBatterName} {previewText}
            </div>
            <div className="text-[11px] text-ink-600 mt-1 flex justify-between items-center">
              <span>{isBowlerCredited ? '✅ Credited to bowler' : '❌ Bowler NOT credited'}</span>
              {deliveryType !== 'legal' && <span className="uppercase text-[9px] bg-red-600 text-white px-1 rounded font-bold">{deliveryType}</span>}
            </div>
          </div>

          {/* Action Button - M14: disabled during submit to prevent double-tap submissions */}
          <button
            onClick={handleConfirm}
            disabled={!batterId || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-pitch-700 text-white text-sm font-semibold active:scale-98 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:scale-100 shadow-md cursor-pointer text-center shrink-0 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              'Confirm Wicket'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default WicketSheet;
