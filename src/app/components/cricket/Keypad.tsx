import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface KeypadProps {
  onRecordBall: (params: {
    deliveryType: 'legal' | 'wide' | 'no_ball';
    runs: number;
    runSource: 'bat' | 'bye' | 'leg_bye' | 'penalty';
    boundary: 'none' | 'four' | 'six';
  }) => void;
  onWicketTap: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({ onRecordBall, onWicketTap }) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advDeliveryType, setAdvDeliveryType] = useState<'legal' | 'wide' | 'no_ball'>('legal');
  const [advRunSource, setAdvRunSource] = useState<'bat' | 'bye' | 'leg_bye'>('bat');

  const triggerHaptic = () => {
    const hapticsEnabled = localStorage.getItem('runbook_haptics') !== 'false';
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleRunTap = (runs: number, boundary: 'none' | 'four' | 'six' = 'none') => {
    triggerHaptic();
    onRecordBall({
      deliveryType: 'legal',
      runs,
      runSource: 'bat',
      boundary,
    });
  };

  const handleExtraTap = (type: 'wide' | 'no_ball' | 'bye' | 'leg_bye') => {
    triggerHaptic();
    if (type === 'wide') {
      onRecordBall({
        deliveryType: 'wide',
        runs: 0,
        runSource: 'bye',
        boundary: 'none',
      });
    } else if (type === 'no_ball') {
      onRecordBall({
        deliveryType: 'no_ball',
        runs: 0,
        runSource: 'bat',
        boundary: 'none',
      });
    } else if (type === 'bye') {
      onRecordBall({
        deliveryType: 'legal',
        runs: 1,
        runSource: 'bye',
        boundary: 'none',
      });
    } else if (type === 'leg_bye') {
      onRecordBall({
        deliveryType: 'legal',
        runs: 1,
        runSource: 'leg_bye',
        boundary: 'none',
      });
    }
  };

  const handleAdvancedRunTap = (runs: number) => {
    triggerHaptic();
    const boundary = runs === 4 ? 'four' : runs === 6 ? 'six' : 'none';
    onRecordBall({
      deliveryType: advDeliveryType,
      runs,
      runSource: advRunSource,
      boundary,
    });
    setShowAdvanced(false);
  };

  const handlePenaltyTap = (awardedTo: 'batting' | 'fielding') => {
    triggerHaptic();
    onRecordBall({
      deliveryType: 'legal',
      runs: 5,
      runSource: 'penalty',
      boundary: 'none',
    });
    setShowAdvanced(false);
  };

  return (
    <div 
      className="bg-card border-t border-ink-200 px-4 py-3 flex flex-col gap-3 relative shadow-inner select-none shrink-0 z-10"
      role="region"
      aria-label="Ball Entry Keypad"
    >
      {/* 2 Rows x 6 Columns Keypad Layout */}
      <div className="grid grid-cols-6 gap-1.5">
        {/* Row 1: Runs 0, 1, 2, 3, 4, 6 */}
        <button
          onClick={() => handleRunTap(0)}
          aria-label="Score 0 runs (Dot ball)"
          className="h-12 rounded-xl border border-ink-200 bg-card font-black text-base text-ink-900 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={() => handleRunTap(1)}
          aria-label="Score 1 run"
          className="h-12 rounded-xl border border-ink-200 bg-card font-black text-base text-ink-900 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center"
        >
          1
        </button>
        <button
          onClick={() => handleRunTap(2)}
          aria-label="Score 2 runs"
          className="h-12 rounded-xl border border-ink-200 bg-card font-black text-base text-ink-900 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center"
        >
          2
        </button>
        <button
          onClick={() => handleRunTap(3)}
          aria-label="Score 3 runs"
          className="h-12 rounded-xl border border-ink-200 bg-card font-black text-base text-ink-900 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center"
        >
          3
        </button>
        <button
          onClick={() => handleRunTap(4, 'four')}
          aria-label="Score 4 runs (Boundary)"
          className="h-12 rounded-xl border-2 border-pitch-700 bg-pitch-100 font-black text-base text-pitch-700 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex flex-col items-center justify-center underline decoration-pitch-700 decoration-2 underline-offset-2"
        >
          4
        </button>
        <button
          onClick={() => handleRunTap(6, 'six')}
          aria-label="Score 6 runs (Boundary)"
          className="h-12 rounded-xl bg-pitch-700 font-black text-base text-white active:scale-95 transition-transform duration-100 cursor-pointer shadow-md flex items-center justify-center"
        >
          6
        </button>

        {/* Row 2: W, WD, NB, LB, B, ... */}
        <button
          onClick={() => { triggerHaptic(); onWicketTap(); }}
          aria-label="Record a Wicket"
          className="h-12 rounded-xl bg-amber-600 font-black text-base text-white active:scale-95 transition-transform duration-100 cursor-pointer shadow-md flex items-center justify-center"
        >
          W
        </button>
        <button
          onClick={() => handleExtraTap('wide')}
          aria-label="Record Wide (1 extra)"
          className="h-12 rounded-xl border border-blue-600 bg-blue-100 font-black text-xs text-blue-600 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center"
        >
          WD
        </button>
        <button
          onClick={() => handleExtraTap('no_ball')}
          aria-label="Record No-Ball (1 extra)"
          className="h-12 rounded-xl border border-purple-600 bg-purple-100 font-black text-xs text-purple-600 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center"
        >
          NB
        </button>
        <button
          onClick={() => handleExtraTap('leg_bye')}
          aria-label="Record Leg-Bye (1 run)"
          className="h-12 rounded-xl border border-ink-400 bg-ink-100 font-black text-xs text-ink-700 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center border-dashed"
        >
          LB
        </button>
        <button
          onClick={() => handleExtraTap('bye')}
          aria-label="Record Bye (1 run)"
          className="h-12 rounded-xl border border-ink-400 bg-ink-100 font-black text-xs text-ink-700 active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center border-dashed"
        >
          B
        </button>
        <button
          onClick={() => { triggerHaptic(); setShowAdvanced(true); }}
          aria-label="Open Advanced Scoring Panel"
          className={`h-12 rounded-xl border font-black text-base active:scale-95 transition-transform duration-100 cursor-pointer shadow-sm flex items-center justify-center ${
            showAdvanced 
              ? 'bg-ink-900 text-ink-50 border-ink-900' 
              : 'bg-card text-ink-700 border-ink-200'
          }`}
        >
          ⋯
        </button>
      </div>

      {/* Advanced Bottom Sheet Overlay - Fixed Full Viewport Backdrop Overlay */}
      {showAdvanced && (
        <>
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity duration-200 z-[99]" 
            onClick={() => setShowAdvanced(false)}
            aria-hidden="true"
          />
          {/* Modal Content Sheet */}
          <div 
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-[430px] bg-card border-t border-ink-200 p-4 rounded-t-2xl shadow-2xl flex flex-col gap-4 animate-[slideup_220ms_cubic-bezier(0.2,0,0,1)] z-[100] pb-[calc(env(safe-area-inset-bottom)+16px)]"
            role="dialog"
            aria-modal="true"
            aria-label="Advanced Scoring Options"
          >
            <div className="flex items-center justify-between border-b border-ink-100 pb-2">
              <span className="text-sm font-black text-ink-900 flex items-center gap-1">
                Advanced Entry
              </span>
              <button
                onClick={() => setShowAdvanced(false)}
                className="text-xs text-ink-400 font-bold uppercase hover:text-ink-700 cursor-pointer px-2 py-1"
              >
                Close
              </button>
            </div>

            {/* Toggle Delivery Type */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-ink-400 uppercase tracking-wider">Delivery Type</span>
              <div className="flex gap-1.5">
                {(['legal', 'wide', 'no_ball'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { triggerHaptic(); setAdvDeliveryType(type); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer uppercase ${
                      advDeliveryType === type
                        ? type === 'legal'
                          ? 'bg-pitch-700 text-white border-pitch-700'
                          : type === 'wide'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-purple-600 text-white border-purple-600'
                        : 'bg-ink-50 text-ink-700 border-ink-200 hover:bg-ink-100'
                    }`}
                  >
                    {type === 'no_ball' ? 'No-Ball' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Runs Source */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-ink-400 uppercase tracking-wider">Run Attribute Source</span>
              <div className="flex gap-1.5">
                {(['bat', 'bye', 'leg_bye'] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => { triggerHaptic(); setAdvRunSource(source); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      advRunSource === source
                        ? 'bg-pitch-700 text-white border-pitch-700'
                        : 'bg-ink-50 text-ink-700 border-ink-200 hover:bg-ink-100'
                    }`}
                  >
                    {source === 'bat' ? 'Off Bat' : source === 'bye' ? 'Byes' : 'Leg-Byes'}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Run Tap Grid (Tapping records instantly and closes) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-ink-400 uppercase tracking-wider">Select Runs to Record</span>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleAdvancedRunTap(num)}
                    className="py-2.5 rounded-xl border border-ink-200 bg-card font-black text-sm text-ink-900 active:scale-95 hover:bg-ink-100 transition-all cursor-pointer shadow-sm"
                  >
                    {num} {num === 4 || num === 6 ? '★' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Penalty Runs */}
            <div className="flex flex-col gap-1.5 border-t border-ink-100 pt-3">
              <span className="text-[10px] font-black text-ink-400 uppercase tracking-wider">Award Conduct Penalty (+5 runs)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePenaltyTap('batting')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-pitch-100 text-pitch-700 hover:bg-pitch-700 hover:text-white transition-colors cursor-pointer border border-transparent shadow-sm"
                >
                  To Batting Side
                </button>
                <button
                  onClick={() => handlePenaltyTap('fielding')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer border border-transparent shadow-sm"
                >
                  To Fielding Side
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default Keypad;
