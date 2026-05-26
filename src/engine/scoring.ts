import { Delivery, DismissalType, Player, InningsState } from './types';

/**
 * Format a number of legal balls into standard cricket overs notation (e.g., 5 balls -> "0.5", 6 balls -> "1.0", 7 balls -> "1.1").
 * Respects The Hundred format where sets are 5 balls each (or 10 balls, but for scoring display we standardise sets of 5 or just total balls).
 * Let's support standard 6-ball overs by default, and 5-ball sets for The Hundred.
 */
export function formatOvers(balls: number, isHundred: boolean = false): string {
  const ballsPerOver = isHundred ? 5 : 6;
  const completedOvers = Math.floor(balls / ballsPerOver);
  const remainingBalls = balls % ballsPerOver;
  return `${completedOvers}.${remainingBalls}`;
}

/**
 * Helper to display overs float representation correctly (e.g., 12.3 means 12 overs and 3 balls)
 * Returns the total number of legal balls.
 */
export function oversToBalls(oversStr: string, isHundred: boolean = false): number {
  const ballsPerOver = isHundred ? 5 : 6;
  const parts = oversStr.split('.');
  const overs = parseInt(parts[0], 10) || 0;
  const balls = parseInt(parts[1], 10) || 0;
  return overs * ballsPerOver + balls;
}

/**
 * Rotate strike based on runs scored, delivery type, and whether it's the end of an over.
 * Returns the new striker and non-striker IDs.
 */
export function determineStrikeRotation(params: {
  delivery: Delivery;
  currentStrikerId: string;
  currentNonStrikerId: string;
  isOverEnded: boolean;
}): { strikerId: string; nonStrikerId: string } {
  const { delivery, currentStrikerId, currentNonStrikerId, isOverEnded } = params;

  let strikerId = currentStrikerId;
  let nonStrikerId = currentNonStrikerId;

  // 1. Wides: never rotate strike on a wide delivery itself, regardless of runs
  if (delivery.deliveryType === 'wide') {
    // No rotation
  } 
  // 2. Dismissals with crossed-over rules
  else if (delivery.wicket) {
    if (delivery.wicket.type === 'run_out' || delivery.wicket.type === 'obstructing') {
      const outBatterId = delivery.wicket.batterId;
      const runsBefore = delivery.wicket.runsBefore || 0;
      const isRunsBeforeOdd = runsBefore % 2 !== 0;

      // Determine who was at which end at the start of the incomplete run
      const startStrikerId = isRunsBeforeOdd ? currentNonStrikerId : currentStrikerId;
      const startNonStrikerId = isRunsBeforeOdd ? currentStrikerId : currentNonStrikerId;

      if (delivery.wicket.crossed) {
        if (outBatterId === startStrikerId) {
          strikerId = startNonStrikerId;
          nonStrikerId = '';
        } else {
          strikerId = '';
          nonStrikerId = startStrikerId;
        }
      } else {
        if (outBatterId === startStrikerId) {
          strikerId = '';
          nonStrikerId = startNonStrikerId;
        } else {
          strikerId = startStrikerId;
          nonStrikerId = '';
        }
      }
    } else {
      // For other dismissals (bowled, caught, lbw, stumped, hit wicket, hit twice):
      // Under MCC Law 18.11 (2022 Update), the new batter must face the next ball (at the striker's end)
      // regardless of whether they crossed, unless it is the end of the over.
      strikerId = ''; // striker is out, needs new batter at striker end
      nonStrikerId = currentNonStrikerId;
    }
  }
  // 3. Runs (Bat, Bye, Leg Bye, No-Ball)
  else {
    const scoredRuns = delivery.runs;
    const isOdd = scoredRuns % 2 !== 0;

    if (isOdd) {
      // Swap striker and non-striker
      strikerId = currentNonStrikerId;
      nonStrikerId = currentStrikerId;
    }
  }

  // 4. Over complete: swap strike (applies after delivery rotation, if over complete)
  // Note: this should only happen if the innings isn't complete, but we handle it here.
  if (isOverEnded && strikerId && nonStrikerId) {
    const temp = strikerId;
    strikerId = nonStrikerId;
    nonStrikerId = temp;
  }

  return { strikerId, nonStrikerId };
}

/**
 * Generate a standard scorecard text description for a wicket.
 */
export function formatDismissalText(
  wicket: Delivery['wicket'],
  bowlerName: string,
  playersMap: Record<string, Player>
): string {
  if (!wicket) return 'not out';

  const batter = playersMap[wicket.batterId]?.shortName || 'Batsman';
  const bowler = bowlerName;
  const fielder = wicket.fielderId ? (playersMap[wicket.fielderId]?.shortName || 'Fielder') : '';

  switch (wicket.type) {
    case 'bowled':
      return `b ${bowler}`;
    case 'caught':
      return fielder ? `c ${fielder} b ${bowler}` : `c & b ${bowler}`;
    case 'lbw':
      return `lbw b ${bowler}`;
    case 'stumped':
      return `st ${fielder || 'Keeper'} b ${bowler}`;
    case 'hit_wicket':
      return `hit wicket b ${bowler}`;
    case 'run_out': {
      const runPrefix = wicket.runsBefore ? `[${wicket.runsBefore} runs] ` : '';
      return `${runPrefix}run out (${fielder || 'Fielder'})`;
    }
    case 'obstructing':
      return 'obstructing the field';
    case 'hit_twice':
      return 'hit the ball twice';
    case 'timed_out':
      return 'timed out';
    case 'retired_out':
      return 'retired out';
    case 'retired_hurt':
      return 'retired hurt';
    default:
      return 'out';
  }
}
