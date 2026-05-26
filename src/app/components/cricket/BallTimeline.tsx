import React from 'react';
import { MatchDerivedState, Delivery } from '../../../engine/types';
import { BallDot } from './BallDot';

interface BallTimelineProps {
  derivedState: MatchDerivedState;
  onEditBall?: (delivery: Delivery) => void;
}

export const BallTimeline: React.FC<BallTimelineProps> = ({ derivedState, onEditBall }) => {
  const { currentInningsState, match } = derivedState;

  if (!currentInningsState) return null;

  const { legalBallsCount, activeBowlerId } = currentInningsState;
  const isHundred = match.format === 'Hundred';
  const ballsPerOver = isHundred ? 5 : 6;

  // Retrieve current active deliveries
  const currentInnings = match.innings[derivedState.currentInningsIndex];
  const deliveries = currentInnings ? currentInnings.deliveries : [];

  // Determine current over number to display
  let currentOverNumber = Math.floor(legalBallsCount / ballsPerOver);
  let isOverCompleteState = false;

  if (legalBallsCount > 0 && legalBallsCount % ballsPerOver === 0) {
    // If the last delivery of the innings was over complete, and we don't have an active bowler yet,
    // we display the completed over.
    const lastDelivery = deliveries[deliveries.length - 1];
    if (lastDelivery && lastDelivery.isOverComplete && !activeBowlerId) {
      currentOverNumber = (legalBallsCount / ballsPerOver) - 1;
      isOverCompleteState = true;
    }
  }

  // Filter deliveries for the current over
  const overDeliveries = deliveries.filter(d => d.overNumber === currentOverNumber);

  // Count legal balls scored in this over
  const legalScored = overDeliveries.filter(d => d.deliveryType === 'legal').length;

  return (
    <div className="mx-4 mt-3 bg-card border border-ink-200 rounded-xl p-3 shadow-sm select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-semibold text-ink-700 mb-2">
        <span className="uppercase tracking-wider">
          {isHundred ? `Set ${currentOverNumber + 1}` : `Over ${currentOverNumber + 1}`}
        </span>
        <span className="font-mono text-ink-400">
          {isOverCompleteState ? (
            <span className="text-pitch-700 font-bold uppercase">Complete</span>
          ) : (
            `${legalScored} of ${ballsPerOver} legal balls`
          )}
        </span>
      </div>

      {/* Horizontal Dots Row */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar min-h-[40px]">
        {overDeliveries.map((d, index) => (
          <button
            key={d.id}
            onClick={() => onEditBall && onEditBall(d)}
            className="hover:scale-105 transition-transform active:scale-95 duration-100 cursor-pointer focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center -mx-1"
            aria-label={`Edit ball ${index + 1}`}
          >
            <BallDot d={d} size={32} />
          </button>
        ))}

        {/* Pending ball indicator (only if over is not completed and bowler is selected) */}
        {!isOverCompleteState && activeBowlerId && (
          <div className="shrink-0">
            <BallDot d="pending" size={32} />
          </div>
        )}
      </div>
    </div>
  );
};
