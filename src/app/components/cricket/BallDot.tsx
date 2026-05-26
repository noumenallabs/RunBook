import React from 'react';
import { Delivery } from '../../../engine/types';

interface BallDotProps {
  d: Delivery | 'pending';
  size?: number;
}

export const BallDot: React.FC<BallDotProps> = ({ d, size = 32 }) => {
  const baseStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    fontSize: size > 30 ? '13px' : '10px',
  };

  if (d === 'pending') {
    return (
      <div
        style={baseStyle}
        className="rounded-full border-2 border-dashed border-pitch-700/50 flex items-center justify-center text-pitch-700/60 font-semibold"
      >
        •
      </div>
    );
  }

  // Wicket is highest priority visual indicator
  if (d.wicket) {
    return (
      <div
        style={baseStyle}
        className="rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shadow-sm select-none"
      >
        W
      </div>
    );
  }

  // Wides
  if (d.deliveryType === 'wide') {
    const wideRuns = d.runs; // additional runs besides penalty
    const superscript = wideRuns > 0 ? `⁺${wideRuns}` : '';
    return (
      <div
        style={baseStyle}
        className="rounded-full bg-blue-100 border border-dashed border-blue-600 text-blue-600 font-bold flex flex-col items-center justify-center leading-none select-none"
      >
        <span className="text-[10px]">Wd</span>
        {superscript && <span className="text-[9px] font-semibold">{superscript}</span>}
      </div>
    );
  }

  // No Balls
  if (d.deliveryType === 'no_ball') {
    const batRuns = d.runSource === 'bat' ? d.runs : 0;
    const additionalRuns = d.runSource !== 'bat' ? d.runs : 0;
    const extraLabel = d.runSource !== 'bat' && d.runSource !== 'penalty' ? (d.runSource === 'bye' ? 'B' : 'Lb') : '';
    
    let suffix = '';
    if (batRuns > 0) suffix = `⁺${batRuns}`;
    else if (additionalRuns > 0) suffix = `⁺${additionalRuns}${extraLabel}`;

    return (
      <div
        style={baseStyle}
        className="rounded-full bg-purple-100 border border-dashed border-purple-600 text-purple-600 font-bold flex flex-col items-center justify-center leading-none select-none"
      >
        <span className="text-[10px]">Nb</span>
        {suffix && <span className="text-[9px] font-semibold">{suffix}</span>}
      </div>
    );
  }

  // Byes and Leg-byes on legal deliveries
  if (d.runSource === 'bye' || d.runSource === 'leg_bye') {
    const label = d.runSource === 'bye' ? 'B' : 'Lb';
    return (
      <div
        style={baseStyle}
        className="rounded-full bg-ink-100 border border-dashed border-ink-400 text-ink-700 font-bold flex flex-col items-center justify-center leading-none select-none"
      >
        <span className="text-[9px]">{label}</span>
        <span className="text-[10px] font-semibold">{d.runs}</span>
      </div>
    );
  }

  // Boundary 4
  if (d.boundary === 'four') {
    return (
      <div
        style={baseStyle}
        className="rounded-full bg-pitch-100 border border-pitch-700 text-pitch-700 font-bold flex items-center justify-center shadow-sm select-none underline decoration-2 decoration-pitch-700"
      >
        4
      </div>
    );
  }

  // Boundary 6
  if (d.boundary === 'six') {
    return (
      <div
        style={baseStyle}
        className="rounded-full bg-pitch-700 text-white font-bold flex items-center justify-center shadow-sm select-none"
      >
        6
      </div>
    );
  }

  // Dot Ball (0 runs scored off bat/source on legal ball)
  if (d.runs === 0) {
    return (
      <div
        style={baseStyle}
        className="rounded-full bg-ink-200 text-ink-900 font-bold flex items-center justify-center select-none"
      >
        ·
      </div>
    );
  }

  // Regular runs off bat
  return (
    <div
      style={baseStyle}
      className="rounded-full bg-card border border-ink-200 text-ink-900 font-bold flex items-center justify-center shadow-sm select-none"
    >
      {d.runs}
    </div>
  );
};
