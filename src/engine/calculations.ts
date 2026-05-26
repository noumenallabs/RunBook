/**
 * Calculate Current Run Rate (CRR).
 * CRR = (Runs / Legal Balls) * ballsPerOver
 */
export function calculateCurrentRunRate(runs: number, legalBalls: number, isHundred: boolean = false): number {
  if (legalBalls === 0) return 0.0;
  const ballsPerOver = isHundred ? 5 : 6;
  return parseFloat(((runs / legalBalls) * ballsPerOver).toFixed(2));
}

/**
 * Calculate Required Run Rate (RRR).
 * RRR = (Runs Needed / Balls Remaining) * ballsPerOver
 */
export function calculateRequiredRunRate(runsNeeded: number, ballsRemaining: number, isHundred: boolean = false): number {
  if (runsNeeded <= 0) return 0.0;
  if (ballsRemaining <= 0) return 99.99;
  const ballsPerOver = isHundred ? 5 : 6;
  return parseFloat(((runsNeeded / ballsRemaining) * ballsPerOver).toFixed(2));
}

/**
 * Calculate Batter Strike Rate.
 * SR = (Runs / Balls Faced) * 100
 */
export function calculateStrikeRate(runs: number, ballsFaced: number): number {
  if (ballsFaced === 0) return 0.0;
  return parseFloat(((runs / ballsFaced) * 100).toFixed(1));
}

/**
 * Calculate Bowler Economy Rate.
 * Economy = (Runs Conceded / Legal Balls) * ballsPerOver
 */
export function calculateEconomyRate(runsConceded: number, legalBalls: number, isHundred: boolean = false): number {
  if (legalBalls === 0) return 0.0;
  const ballsPerOver = isHundred ? 5 : 6;
  return parseFloat(((runsConceded / legalBalls) * ballsPerOver).toFixed(2));
}

/**
 * Calculate Net Run Rate (NRR) for a team in a match.
 * If all out, the team is deemed to have faced their full quota of overs.
 */
export function calculateNetRunRate(params: {
  runsScored: number;
  oversFaced: number; // decimal e.g. 15.2
  allOutFaced: boolean;
  totalOversQuota: number; // e.g. 20
  runsConceded: number;
  oversBowled: number;
  allOutBowled: boolean;
  totalOversConcededQuota: number;
  isHundred?: boolean;
}): number {
  const {
    runsScored,
    oversFaced,
    allOutFaced,
    totalOversQuota,
    runsConceded,
    oversBowled,
    allOutBowled,
    totalOversConcededQuota,
    isHundred = false,
  } = params;

  const ballsPerOver = isHundred ? 5 : 6;

  // Helper to convert overs float representation (e.g. 15.2) to total overs float (e.g. 15.333)
  const toDecimalOvers = (overs: number, allOut: boolean, quota: number): number => {
    if (allOut) return quota; // rule: if all out, treat as full quota
    const completed = Math.floor(overs);
    const balls = Math.round((overs - completed) * 10);
    const decimal = completed + balls / ballsPerOver;
    return decimal === 0 ? quota : decimal;
  };

  const decOversFaced = toDecimalOvers(oversFaced, allOutFaced, totalOversQuota);
  const decOversBowled = toDecimalOvers(oversBowled, allOutBowled, totalOversConcededQuota);

  const scoringRate = decOversFaced === 0 ? 0 : runsScored / decOversFaced;
  const concedingRate = decOversBowled === 0 ? 0 : runsConceded / decOversBowled;

  return parseFloat((scoringRate - concedingRate).toFixed(3));
}
