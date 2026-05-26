import React from 'react';
import { MatchDerivedState } from '../../../engine/types';

interface FreeHitBannerProps {
  derivedState: MatchDerivedState;
}

export const FreeHitBanner: React.FC<FreeHitBannerProps> = ({ derivedState }) => {
  const { currentInningsState, match, currentInningsIndex } = derivedState;

  if (!currentInningsState) return null;

  // Calculate if the next delivery is a free hit
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

  if (!isFreeHit) return null;

  return (
    <div className="bg-purple-600 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-1.5 animate-[slidedown_220ms_cubic-bezier(0.2,0,0,1)] shadow-inner select-none uppercase tracking-wider">
      <span>⚡</span>
      <span>FREE HIT — only run-out, obstructing, hit-twice dismissals apply</span>
      <span>⚡</span>
    </div>
  );
};
