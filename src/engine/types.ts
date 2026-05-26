export type FormatType = 'T5' | 'T10' | 'T20' | 'Hundred' | 'ODI' | 'custom';

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'stumped'
  | 'hit_wicket'
  | 'run_out'
  | 'obstructing'
  | 'hit_twice'
  | 'timed_out'
  | 'retired_out'
  | 'retired_hurt';

export interface Player {
  id: string;
  name: string;
  shortName: string;
  role: 'bat' | 'bowl' | 'all' | 'wk';
  isCaptain: boolean;
  isKeeper: boolean;
  jerseyNumber?: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  players: Player[];
  battingOrder: string[]; // player ids
}

export interface Delivery {
  id: string; // UUID v4
  matchId: string;
  inningsIndex: 0 | 1;
  overNumber: number; // 0-indexed over
  ballInOver: number; // 0-indexed position of legal balls in over
  timestamp: number;
  deliveryType: 'legal' | 'wide' | 'no_ball';
  runs: number;
  runSource: 'bat' | 'bye' | 'leg_bye' | 'penalty';
  boundary: 'none' | 'four' | 'six';
  wicket?: {
    type: DismissalType;
    batterId: string;
    fielderId?: string;
    fielderEnd?: 'striker' | 'non_striker';
    runsBefore?: number;
    crossed?: boolean;
  };
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isFreeHit: boolean;
  isOverComplete: boolean;
}

export interface Innings {
  battingTeamIndex: 0 | 1; // index in Match.teams
  deliveries: Delivery[];
  target?: number; // 2nd innings only
  dlsTarget?: number; // manual override
  declaredAt?: number;
}

export type MatchState =
  | 'SETUP'
  | 'TOSS'
  | 'INNINGS_SETUP'
  | 'SCORING'
  | 'INNINGS_BREAK'
  | 'MATCH_END'
  | 'RESULT';

export interface MatchResult {
  winnerId?: string; // team id, or undefined if tie/no-result
  type: 'runs' | 'wickets' | 'tie' | 'no_result';
  margin?: number; // runs or wickets count
  playerOfMatch?: string; // player id
  description: string; // e.g., "Mumbai Strikers won by 34 runs"
}

export interface Match {
  id: string;
  format: FormatType;
  totalOvers: number;
  teams: [Team, Team];
  toss?: {
    winnerId: string;
    decision: 'bat' | 'bowl';
  };
  innings: Innings[]; // length 0, 1, or 2
  state: MatchState;
  superOverEnabled: boolean;
  scoreConvention: 'runs_wickets' | 'wickets_runs'; // IND vs AUS format
  powerplayOvers: number;
  createdAt: number;
  venue?: string;
  result?: MatchResult;
}

// Event Sourcing Log Entries
export type ScorecardEvent =
  | { type: 'SETUP_MATCH'; match: Match }
  | { type: 'TOSS_COMPLETE'; winnerId: string; decision: 'bat' | 'bowl' }
  | { type: 'START_INNINGS'; battingTeamIndex: 0 | 1; strikerId: string; nonStrikerId: string; bowlerId: string }
  | { type: 'DELIVERY'; delivery: Delivery }
  | { type: 'UNDO_DELIVERY'; deliveryId: string }
  | { type: 'EDIT_DELIVERY'; deliveryId: string; patch: Partial<Delivery>; reason: string }
  | { type: 'NEW_BATTER'; batterId: string; position: 'striker' | 'non_striker' }
  | { type: 'NEW_BOWLER'; bowlerId: string }
  | { type: 'RETIRE_BATTER'; batterId: string; isOut: boolean } // isOut=true -> Retired Out, false -> Retired Hurt
  | { type: 'INNINGS_END'; reason: 'all_out' | 'overs_done' | 'declared' | 'target_reached' }
  | { type: 'DECLARE_INNINGS' }
  | { type: 'MATCH_END'; result: MatchResult }
  | { type: 'PENALTY'; runs: number; awardedTo: 'batting' | 'fielding' }
  | { type: 'CHANGE_KEEPER'; newKeeperId: string }
  | { type: 'SELECT_PLAYER_OF_MATCH'; playerId: string };

export interface EventEntry {
  id: string; // UUID v4
  event: ScorecardEvent;
  timestamp: number;
  matchId: string;
}

// Derived State for UI rendering
export interface BatterStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalDescription?: string;
  retired?: 'hurt' | 'out';
}

export interface BowlerStats {
  playerId: string;
  deliveries: number; // total deliveries bowled (including wides/no-balls for total count, but converted to overs)
  legalDeliveries: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

export interface Partnership {
  batterAId: string;
  batterBId: string;
  runs: number;
  balls: number; // legal balls + no-balls (wides don't count)
  active: boolean;
}

export interface InningsState {
  battingTeamIndex: 0 | 1;
  score: number;
  wickets: number;
  oversCount: number; // e.g. 12.3 is represented as: 12 overs and 3 balls (or balls count = 12*6 + 3 = 75 balls)
  legalBallsCount: number;
  totalBallsCount: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
    total: number;
  };
  batterStats: Record<string, BatterStats>; // playerId -> BatterStats
  bowlerStats: Record<string, BowlerStats>; // playerId -> BowlerStats
  partnerships: Partnership[];
  currentPartnership?: Partnership;
  fallOfWickets: {
    wicketNumber: number;
    score: number;
    wickets: number;
    overs: number; // representation, e.g. 12.3
    balls: number; // total legal balls
    batterId: string;
  }[];
  activeStrikerId?: string;
  activeNonStrikerId?: string;
  activeBowlerId?: string;
  prevBowlerId?: string;
  isCompleted: boolean;
}

export interface MatchDerivedState {
  match: Match;
  inningsStates: InningsState[];
  currentInningsIndex: number; // 0 or 1
  currentInningsState?: InningsState;
  isMatchFinished: boolean;
}
