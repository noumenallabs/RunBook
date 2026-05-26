import { Match, InningsState, DismissalType, FormatType } from './types';
import { formatOvers } from './scoring';

/**
 * Check if a dismissal type is allowed given the delivery conditions (wide, no-ball, free hit).
 */
export function isDismissalAllowed(params: {
  dismissalType: DismissalType;
  deliveryType: 'legal' | 'wide' | 'no_ball';
  isFreeHit: boolean;
}): { allowed: boolean; reason?: string } {
  const { dismissalType, deliveryType, isFreeHit } = params;

  // On a Free Hit (front foot no-ball carryover):
  // Striker can only be dismissed by: Run Out, Obstructing the Field, Hit the Ball Twice.
  // On a Free Hit (front foot no-ball carryover):
  // Striker can only be dismissed by: Run Out, Obstructing the Field, Hit the Ball Twice (plus retirements).
  if (isFreeHit) {
    const freeHitAllowed: DismissalType[] = ['run_out', 'obstructing', 'hit_twice', 'retired_hurt', 'retired_out'];
    if (!freeHitAllowed.includes(dismissalType)) {
      return {
        allowed: false,
        reason: `Only Run Out, Obstructing, and Hit Twice are allowed on a Free Hit.`,
      };
    }
  }

  // On a No-ball (independent of whether it was a free hit):
  // Striker can only be dismissed by: Run Out, Obstructing the Field, Hit the Ball Twice (plus retirements).
  if (deliveryType === 'no_ball') {
    const noBallAllowed: DismissalType[] = ['run_out', 'obstructing', 'hit_twice', 'retired_hurt', 'retired_out'];
    if (!noBallAllowed.includes(dismissalType)) {
      return {
        allowed: false,
        reason: `Only Run Out, Obstructing, and Hit Twice are allowed on a No-ball.`,
      };
    }
  }

  // On a Wide:
  // Striker can only be dismissed by: Stumped, Run Out, Obstructing the Field.
  // (Cannot be bowled, caught, lbw, hit wicket, or hit the ball twice)
  if (deliveryType === 'wide') {
    const wideAllowed: DismissalType[] = ['stumped', 'run_out', 'obstructing', 'retired_hurt', 'retired_out'];
    if (!wideAllowed.includes(dismissalType)) {
      return {
        allowed: false,
        reason: `Only Stumped, Run Out, and Obstructing are allowed on a Wide.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Get the maximum overs allowed per bowler based on the match format.
 */
export function getMaxOversPerBowler(format: FormatType, totalOvers: number): number {
  switch (format) {
    case 'T5':
      return 1;
    case 'T10':
      return 2;
    case 'T20':
      return 4;
    case 'ODI':
      return 10;
    case 'Hundred':
      return 4; // 20 balls / 5 balls per set = 4 sets
    case 'custom':
    default:
      return Math.max(1, Math.floor(totalOvers / 5));
  }
}

/**
 * Verify if a bowler is eligible to bowl the next over/set.
 */
export function verifyBowlerEligibility(params: {
  bowlerId: string;
  match: Match;
  inningsState: InningsState;
}): { eligible: boolean; reason?: string } {
  const { bowlerId, match, inningsState } = params;
  const isHundred = match.format === 'Hundred';

  // Get current stats for this bowler
  const stats = inningsState.bowlerStats[bowlerId];
  const maxOvers = getMaxOversPerBowler(match.format, match.totalOvers);

  if (stats) {
    if (isHundred) {
      // 20 balls total limit
      if (stats.legalDeliveries >= 20) {
        return {
          eligible: false,
          reason: `Bowler has reached the maximum quota of 20 balls.`,
        };
      }
    } else {
      // Overs quota limit (Math.ceil handles incomplete overs correctly)
      const oversBowled = Math.ceil(stats.legalDeliveries / 6);
      if (oversBowled >= maxOvers) {
        return {
          eligible: false,
          reason: `Bowler has reached the maximum quota of ${maxOvers} overs.`,
        };
      }
    }
  }

  // Back-to-back limits:
  if (isHundred) {
    // In The Hundred, a bowler can bowl 10 balls (2 sets of 5) consecutively.
    // They cannot bowl a 3rd set of 5 consecutively.
    // Check if the bowler bowled the last 2 sets.
    const deliveries = inningsState.totalBallsCount; // total deliveries bowled in innings
    const currentSetIndex = Math.floor(deliveries / 5);
    
    if (currentSetIndex >= 2) {
      // Look at the last 10 legal deliveries to check bowler IDs
      const last10Deliveries = inningsState.fallOfWickets; // wait, we have inningsState.deliveries or deliveries in inningsState
      // Let's count deliveries in the last 2 sets
      // We can inspect the deliveries array directly if we want, or just get bowlerId list.
      // Let's assume we can get it from deliveries.
      const matchInnings = match.innings[match.innings.length - 1];
      if (matchInnings && matchInnings.deliveries.length >= 10) {
        // filter out wides/no_balls to get last 10 legal deliveries
        const legalDels = matchInnings.deliveries.filter(d => d.deliveryType === 'legal');
        if (legalDels.length >= 10) {
          const set1Bowler = legalDels[legalDels.length - 1].bowlerId;
          const set2Bowler = legalDels[legalDels.length - 6].bowlerId;
          
          if (set1Bowler === bowlerId && set2Bowler === bowlerId) {
            return {
              eligible: false,
              reason: `Bowler has just bowled 2 consecutive 5-ball sets (10 balls) and must be changed.`,
            };
          }
        }
      }
    }
  } else {
    // Standard cricket: cannot bowl consecutive overs
    if (inningsState.prevBowlerId === bowlerId) {
      return {
        eligible: false,
        reason: `Bowler just bowled the previous over.`,
      };
    }
  }

  return { eligible: true };
}
