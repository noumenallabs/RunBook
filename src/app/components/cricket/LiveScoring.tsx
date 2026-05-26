import React, { useState, useEffect } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { useScoring } from '../../../hooks/useScoring';
import { ScoreHeader } from './ScoreHeader';
import { FreeHitBanner } from './FreeHitBanner';
import { PartnershipCard } from './PartnershipCard';
import { BowlerStrip } from './BowlerStrip';
import { BallTimeline } from './BallTimeline';
import { Keypad } from './Keypad';
import { WicketSheet } from './WicketSheet';
import { OverComplete } from './OverComplete';
import { Delivery, DismissalType, Player } from '../../../engine/types';
import { Undo, MoreVertical, LogOut, RefreshCw, Award, Shield, AlertTriangle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export const LiveScoring: React.FC = () => {
  const nav = useNav();
  const { derivedState, undo } = useMatch();
  const {
    recordBall,
    selectBowler,
    selectBatter,
    retireBatter,
    declareInnings,
    recordPenalty,
    editBall,
    endInnings,
    endMatch,
  } = useScoring();

  const [showWicketSheet, setShowWicketSheet] = useState<boolean>(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState<boolean>(false);
  const [showRetireModal, setShowRetireModal] = useState<boolean>(false);
  const [showChangeBowlerModal, setShowChangeBowlerModal] = useState<boolean>(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState<boolean>(false);

  // Custom modal trigger states (replacing alert/confirm)
  const [showDeclareConfirm, setShowDeclareConfirm] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [retireSelectionId, setRetireSelectionId] = useState<string | null>(null);

  // Edit ball states
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [editDelType, setEditDelType] = useState<Delivery['deliveryType']>('legal');
  const [editRuns, setEditRuns] = useState<number>(0);
  const [editSource, setEditSource] = useState<Delivery['runSource']>('bat');
  const [editBoundary, setEditBoundary] = useState<Delivery['boundary']>('none');
  const [editReason, setEditReason] = useState<string>('');

  // Active delivery type selection from keypad (wide/no_ball/legal)
  const [activeDelType, setActiveDelType] = useState<'legal' | 'wide' | 'no_ball'>('legal');

  // Trigger state transitions on state changes
  useEffect(() => {
    if (!derivedState || !derivedState.currentInningsState) return;

    const { currentInningsState, match, currentInningsIndex } = derivedState;
    const { score, wickets, legalBallsCount } = currentInningsState;
    
    const isHundred = match.format === 'Hundred';
    const ballsPerOver = isHundred ? 5 : 6;
    const totalOvers = match.totalOvers;
    const maxBalls = isHundred ? 100 : totalOvers * ballsPerOver;

    const battingTeam = match.teams[currentInningsState.battingTeamIndex];
    const fieldingTeam = match.teams[currentInningsState.battingTeamIndex === 0 ? 1 : 0];

    const allOutWickets = battingTeam.players.length - 1;

    // Check Innings 1 Ending conditions
    if (currentInningsIndex === 0) {
      if (wickets >= allOutWickets || legalBallsCount >= maxBalls) {
        // Innings 1 over
        endInnings('all_out').then(() => {
          nav.go({ name: 'innings_break' });
        });
      }
    }

    // Check Innings 2 Ending conditions
    if (currentInningsIndex === 1 && currentInningsState.target) {
      const target = currentInningsState.target;
      
      if (score >= target) {
        // Chasing team wins
        endMatch(battingTeam.id, 'wickets', 10 - wickets).then(() => {
          nav.go({ name: 'result' });
        });
      } else if (wickets >= allOutWickets || legalBallsCount >= maxBalls) {
        // Chase complete but target not reached
        if (score === target - 1) {
          // Tie
          endMatch(undefined, 'tie').then(() => {
            nav.go({ name: 'result' });
          });
        } else {
          // Batting 1st team wins
          endMatch(fieldingTeam.id, 'runs', target - 1 - score).then(() => {
            nav.go({ name: 'result' });
          });
        }
      }
    }
  }, [derivedState, endInnings, endMatch, nav]);

  if (!derivedState || !derivedState.currentInningsState) {
    return (
      <div className="flex flex-col h-full bg-ink-50 items-center justify-center p-4 text-center">
        <AlertTriangle className="text-amber-600 mb-3" size={40} />
        <span className="text-sm font-bold text-ink-900">No active match found</span>
        <button
          onClick={() => nav.go({ name: 'home' })}
          className="mt-4 px-4 py-2 bg-pitch-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Go Home
        </button>
      </div>
    );
  }

  const { currentInningsState, match } = derivedState;
  const isHundred = match.format === 'Hundred';
  const ballsPerOver = isHundred ? 5 : 6;

  const isOverComplete =
    currentInningsState.legalBallsCount > 0 &&
    currentInningsState.legalBallsCount % ballsPerOver === 0 &&
    !currentInningsState.activeBowlerId;

  const battingTeam = match.teams[currentInningsState.battingTeamIndex];
  const fieldingTeam = match.teams[currentInningsState.battingTeamIndex === 0 ? 1 : 0];

  const handleRecordBall = async (params: {
    deliveryType: 'legal' | 'wide' | 'no_ball';
    runs: number;
    runSource: 'bat' | 'bye' | 'leg_bye' | 'penalty';
    boundary: 'none' | 'four' | 'six';
  }) => {
    await recordBall(params);
    let desc = '';
    if (params.runSource === 'penalty') {
      desc = `Penalty (+5 runs)`;
    } else if (params.deliveryType === 'wide') {
      desc = `Wide${params.runs > 0 ? ` + ${params.runs} runs` : ''}`;
    } else if (params.deliveryType === 'no_ball') {
      desc = `No-Ball${params.runs > 0 ? ` + ${params.runs} runs` : ''}`;
    } else if (params.runSource === 'bye') {
      desc = `${params.runs} Bye${params.runs > 1 ? 's' : ''}`;
    } else if (params.runSource === 'leg_bye') {
      desc = `${params.runs} Leg-Bye${params.runs > 1 ? 's' : ''}`;
    } else {
      desc = params.runs === 0 ? 'Dot ball' : `${params.runs} run${params.runs > 1 ? 's' : ''}`;
    }
    toast.success(`Recorded: ${desc}`, { id: 'ball-record-toast', duration: 1200 });
  };

  const handleConfirmWicket = async (wicket: NonNullable<Delivery['wicket']>) => {
    setShowWicketSheet(false);
    await recordBall({
      deliveryType: activeDelType,
      runs: 0,
      runSource: 'bat',
      boundary: 'none',
      wicket,
    });
    // Reset selection latch
    setActiveDelType('legal');
  };

  const handleBowlerSelected = async (bowlerId: string) => {
    await selectBowler(bowlerId);
  };

  const handleEditBallSelect = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setEditDelType(delivery.deliveryType);
    setEditRuns(delivery.runs);
    setEditSource(delivery.runSource as 'bat' | 'bye' | 'leg_bye');
    setEditBoundary(delivery.boundary);
    setEditReason('');
  };

  const handleConfirmEdit = async () => {
    if (!editingDelivery) return;
    if (!editReason.trim()) {
      toast.error('Please enter a reason for audit tracking.');
      return;
    }

    const patch: Partial<Delivery> = {
      deliveryType: editDelType,
      runs: editRuns,
      runSource: editSource,
      boundary: editBoundary,
    };

    await editBall(editingDelivery.id, patch, editReason.trim());
    toast.success('Ball details modified successfully.');
    setEditingDelivery(null);
  };

  const handleDeclare = () => {
    setShowDeclareConfirm(true);
  };

  return (
    <div className="flex flex-col h-full bg-ink-50 relative">
      {/* Top scoreboard */}
      <ScoreHeader derivedState={derivedState} />

      {/* Free Hit Banner */}
      <FreeHitBanner derivedState={derivedState} />

      {/* Scrollable primary widgets area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Partnership card */}
        <PartnershipCard derivedState={derivedState} />

        {/* Bowler figures strip */}
        <BowlerStrip derivedState={derivedState} />

        {/* Deliveries current over timeline */}
        <BallTimeline
          derivedState={derivedState}
          onEditBall={handleEditBallSelect}
        />

        {/* Unset Striker/Non-Striker check - animate-bounce-3 to stop after 3 iterations */}
        {(!currentInningsState.activeStrikerId || !currentInningsState.activeNonStrikerId) && (
          <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-semibold text-center animate-bounce-3">
            ⚠️ Select batsmen from Roster using the dropdowns or menu!
          </div>
        )}
      </div>

      {/* Keypad entry controls */}
      <Keypad
        onRecordBall={handleRecordBall}
        onWicketTap={() => {
          setShowWicketSheet(true);
        }}
      />

      {/* Bottom action bar with Safe Area Insets pb */}
      <div className="min-h-[56px] bg-card border-t border-ink-200 flex items-center justify-between px-4 pb-[env(safe-area-inset-bottom)] shrink-0 shadow-md">
        {/* Undo button - C13 expanded touch target p-3 min-h-[44px] */}
        <button
          onClick={async () => {
            const success = await undo();
            if (success) {
              toast.success('Undid last delivery scoring.');
            } else {
              toast.error('Nothing left to undo in this over.');
            }
          }}
          className="p-3 min-h-[44px] min-w-[44px] text-ink-700 hover:bg-ink-50 rounded-xl active:scale-95 transition-transform cursor-pointer flex items-center gap-1 font-semibold text-xs"
          aria-label="Undo last ball"
        >
          <Undo size={16} /> Undo
        </button>

        {/* Scorecard navigation */}
        <button
          onClick={() => nav.go({ name: 'scorecard' })}
          className="px-5 py-1.5 border border-pitch-700 text-pitch-700 bg-pitch-100/30 rounded-xl text-xs font-bold active:scale-95 transition-transform cursor-pointer"
        >
          View Scorecard
        </button>

        {/* Overflow ⋮ actions menu trigger */}
        <button
          onClick={() => setShowOverflowMenu(true)}
          className="p-2 text-ink-700 hover:bg-ink-50 rounded-xl active:scale-95 transition-transform cursor-pointer"
          aria-label="Overflow menu"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Over complete select bowler modal overlay */}
      <OverComplete
        isOpen={isOverComplete}
        onConfirm={handleBowlerSelected}
        onUndo={async () => {
          const success = await undo();
          if (success) {
            toast.success('Undid last delivery scoring.');
          }
        }}
        derivedState={derivedState}
      />

      {/* Wicket Drawer entry bottom sheet */}
      <WicketSheet
        isOpen={showWicketSheet}
        onClose={() => setShowWicketSheet(false)}
        onConfirm={handleConfirmWicket}
        derivedState={derivedState}
        deliveryType={activeDelType}
      />

      {/* Audit Log / Edit Ball Modal */}
      {editingDelivery && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_150ms_ease] px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingDelivery(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-4 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <span className="text-sm font-bold text-ink-900 block border-b border-ink-100 pb-2">
              Edit Delivery Figures
            </span>

            {/* Delivery Type */}
            <div className="flex gap-1.5 bg-ink-50 p-0.5 rounded-lg border border-ink-100">
              {(['legal', 'wide', 'no_ball'] as Delivery['deliveryType'][]).map(t => (
                <button
                  key={t}
                  onClick={() => setEditDelType(t)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                    editDelType === t ? 'bg-pitch-700 text-white shadow-sm' : 'text-ink-700 hover:bg-ink-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Runs Input */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-700">Runs scored:</span>
              <input
                type="number"
                min="0"
                max="7"
                value={editRuns}
                onChange={(e) => setEditRuns(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 text-center font-mono font-bold bg-ink-100 border border-ink-200 rounded-lg py-1 focus:outline-none focus:border-pitch-700"
              />
            </div>

            {/* Source */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-700">Attribution Source:</span>
              <div className="flex border border-ink-200 rounded-lg overflow-hidden font-mono text-[10px] font-bold">
                {(['bat', 'bye', 'leg_bye'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setEditSource(s)}
                    className={`px-2 py-1.5 cursor-pointer uppercase ${
                      editSource === s ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Reason */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-700 uppercase">Reason for Edit (Required)</label>
              <input
                type="text"
                placeholder="e.g. Umpire input error / mis-tap"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full bg-ink-100 border border-ink-200 rounded-lg px-2.5 py-1.5 text-xs text-ink-900 font-semibold focus:outline-none focus:border-pitch-700"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-ink-100">
              <button
                onClick={() => setEditingDelivery(null)}
                className="flex-1 py-2 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                disabled={!editReason.trim()}
                onClick={handleConfirmEdit}
                className="flex-1 py-2 bg-pitch-700 text-white rounded-xl text-xs font-semibold disabled:bg-ink-200 disabled:text-ink-400 cursor-pointer text-center"
              >
                Save Audit Patch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overflow Menu Modal Bottom Overlay */}
      {showOverflowMenu && (
        <div className="fixed inset-0 z-40 flex items-end justify-center animate-[fadein_120ms_ease]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowOverflowMenu(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-2xl shadow-2xl p-4 space-y-3 z-10 animate-[slideup_220ms_cubic-bezier(0.2,0,0,1)]">
            <div className="flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-ink-200" />
            </div>

            <div className="flex items-center justify-between border-b border-ink-100 pb-2">
              <span className="text-sm font-bold text-ink-900">Umpire Scorer Tools</span>
              <button
                onClick={() => setShowOverflowMenu(false)}
                className="text-xs text-ink-400 font-bold uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Actions List */}
            <div className="grid grid-cols-1 gap-2">
              {/* Retire batter */}
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  setShowRetireModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 bg-card hover:border-pitch-700 text-left cursor-pointer"
              >
                <LogOut size={16} className="text-pitch-700" />
                <div className="text-xs font-bold text-ink-900">Retire Batter (Hurt / Out)</div>
              </button>

              {/* Change Bowler mid-over */}
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  setShowChangeBowlerModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 bg-card hover:border-pitch-700 text-left cursor-pointer"
              >
                <RefreshCw size={16} className="text-pitch-700" />
                <div className="text-xs font-bold text-ink-900">Change Bowler Mid-Over</div>
              </button>

              {/* Award penalty runs */}
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  setShowPenaltyModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 bg-card hover:border-pitch-700 text-left cursor-pointer"
              >
                <Shield size={16} className="text-pitch-700" />
                <div className="text-xs font-bold text-ink-900">Award Penalty Runs (+5)</div>
              </button>

              {/* Declare Innings */}
              <button
                onClick={() => {
                  setShowDeclareConfirm(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 bg-card hover:border-pitch-700 text-left cursor-pointer"
              >
                <Award size={16} className="text-pitch-700" />
                <div className="text-xs font-bold text-ink-900">Declare Innings</div>
              </button>

              {/* Help & Rules */}
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  nav.go({ name: 'help' });
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 bg-card hover:border-pitch-700 text-left cursor-pointer"
                type="button"
              >
                <HelpCircle size={16} className="text-pitch-700" />
                <div className="text-xs font-bold text-ink-900">Help & Rules</div>
              </button>

              {/* Exit to Home */}
              <button
                onClick={() => {
                  setShowExitConfirm(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-left cursor-pointer transition-colors"
              >
                <LogOut size={16} />
                <div className="text-xs font-bold">Exit Match Scorer</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retire Batter Selection Modal */}
      {showRetireModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRetireModal(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-4 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <span className="text-sm font-bold text-ink-900 block border-b border-ink-100 pb-2">
              Retire Batter
            </span>
            <div className="flex gap-2">
              {currentInningsState.activeStrikerId && (
                <button
                  onClick={() => {
                    setRetireSelectionId(currentInningsState.activeStrikerId!);
                  }}
                  className="flex-1 py-3 bg-ink-100 text-ink-900 rounded-xl text-xs font-bold border border-ink-200 cursor-pointer"
                >
                  Striker: {battingTeam.players.find(p => p.id === currentInningsState.activeStrikerId)?.shortName}
                </button>
              )}
              {currentInningsState.activeNonStrikerId && (
                <button
                  onClick={() => {
                    setRetireSelectionId(currentInningsState.activeNonStrikerId!);
                  }}
                  className="flex-1 py-3 bg-ink-100 text-ink-900 rounded-xl text-xs font-bold border border-ink-200 cursor-pointer"
                >
                  Non-Striker: {battingTeam.players.find(p => p.id === currentInningsState.activeNonStrikerId)?.shortName}
                </button>
              )}
            </div>
            <button
              onClick={() => setShowRetireModal(false)}
              className="w-full py-2 border border-ink-200 text-ink-400 rounded-xl text-xs font-semibold cursor-pointer hover:bg-ink-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* C19: Retired Out vs Hurt Custom Choice Modal */}
      {retireSelectionId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRetireSelectionId(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-ink-900">
                Retire {battingTeam.players.find(p => p.id === retireSelectionId)?.name}?
              </h3>
              <p className="text-xs text-ink-600 font-medium">
                Select the retirement status under MCC Laws:
              </p>
            </div>
            
            <div className="space-y-2 pt-1">
              {/* Retired Hurt (Not Out) */}
              <button
                onClick={async () => {
                  await retireBatter(retireSelectionId, false); // isOut = false
                  setRetireSelectionId(null);
                  setShowRetireModal(false);
                }}
                className="w-full py-3 px-4 border border-ink-200 hover:border-pitch-700 bg-card text-ink-900 rounded-xl text-left cursor-pointer flex flex-col gap-0.5"
              >
                <span className="text-xs font-black text-ink-900">Retired Hurt (Not Out)</span>
                <span className="text-[10px] text-ink-500 font-medium leading-tight">
                  Use for injury, illness, or temporary exit. Batter remains not out and can return to bat later.
                </span>
              </button>

              {/* Retired Out (Counts as Wicket) */}
              <button
                onClick={async () => {
                  await retireBatter(retireSelectionId, true); // isOut = true
                  setRetireSelectionId(null);
                  setShowRetireModal(false);
                }}
                className="w-full py-3 px-4 border border-red-200 hover:border-red-600 bg-red-50 text-red-700 rounded-xl text-left cursor-pointer flex flex-col gap-0.5"
              >
                <span className="text-xs font-black text-red-700">Retired Out (Wicket)</span>
                <span className="text-[10px] text-red-500 font-medium leading-tight">
                  Counts as a wicket. The batter is permanently out and cannot bat again in this innings.
                </span>
              </button>
            </div>

            <button
              onClick={() => setRetireSelectionId(null)}
              className="w-full py-2.5 border border-ink-200 text-ink-400 rounded-xl text-xs font-semibold cursor-pointer text-center hover:bg-ink-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Declare Innings Confirmation Modal */}
      {showDeclareConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeclareConfirm(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-ink-900">Declare Innings?</h3>
              <p className="text-xs text-ink-600 font-medium">
                Are you sure you want to declare the innings for <strong>{battingTeam.name}</strong>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclareConfirm(false)}
                className="flex-1 py-2.5 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 hover:bg-ink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowDeclareConfirm(false);
                  setShowOverflowMenu(false);
                  await declareInnings();
                  if (derivedState.currentInningsIndex === 0) {
                    nav.go({ name: 'innings_break' });
                  } else {
                    const target = currentInningsState.target ?? 0;
                    const score = currentInningsState.score;
                    if (score === target - 1) {
                      await endMatch(undefined, 'tie');
                    } else if (score >= target) {
                      await endMatch(battingTeam.id, 'wickets', 10 - currentInningsState.wickets);
                    } else {
                      await endMatch(fieldingTeam.id, 'runs', target - 1 - score);
                    }
                    nav.go({ name: 'result' });
                  }
                }}
                className="flex-1 py-2.5 bg-pitch-700 text-white rounded-xl text-xs font-black hover:bg-pitch-600 cursor-pointer shadow-sm animate-pulse"
              >
                Confirm Declare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Match Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowExitConfirm(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-ink-900">Exit Match Scorer?</h3>
              <p className="text-xs text-ink-600 font-medium">
                Scoring progress will be saved in IndexedDB and you can resume anytime.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 hover:bg-ink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  setShowOverflowMenu(false);
                  nav.go({ name: 'home' });
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 cursor-pointer shadow-sm"
              >
                Exit Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Bowler Mid-Over Modal */}
      {showChangeBowlerModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowChangeBowlerModal(false)} />
          <div className="relative w-full max-w-xs bg-card rounded-2xl p-4 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10 flex flex-col max-h-[80%]">
            <span className="text-sm font-bold text-ink-900 block border-b border-ink-100 pb-2">
              Select Bowler Mid-Over
            </span>
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {fieldingTeam.players
                .filter(p => p.id !== currentInningsState.activeBowlerId)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={async () => {
                      await selectBowler(player.id);
                      setShowChangeBowlerModal(false);
                    }}
                    className="w-full text-left py-2 px-3 border border-ink-200 rounded-xl font-bold text-xs hover:border-pitch-700 bg-card text-ink-900 cursor-pointer"
                  >
                    {player.name}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setShowChangeBowlerModal(false)}
              className="w-full py-2 border border-ink-200 text-ink-400 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Award Penalty Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPenaltyModal(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-4 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <span className="text-sm font-bold text-ink-900 block border-b border-ink-100 pb-2">
              Award Conduct Penalty (+5 runs)
            </span>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await recordPenalty(5, 'batting');
                  setShowPenaltyModal(false);
                }}
                className="flex-1 py-3 bg-pitch-100 text-pitch-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-pitch-700 hover:text-white transition-colors"
              >
                Batting Side
              </button>
              <button
                onClick={async () => {
                  await recordPenalty(5, 'fielding');
                  setShowPenaltyModal(false);
                }}
                className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-red-600 hover:text-white transition-colors"
              >
                Fielding Side
              </button>
            </div>
            <button
              onClick={() => setShowPenaltyModal(false)}
              className="w-full py-2 border border-ink-200 text-ink-400 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default LiveScoring;
