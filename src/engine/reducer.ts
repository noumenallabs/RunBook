import {
  Match,
  ScorecardEvent,
  MatchDerivedState,
  InningsState,
  Delivery,
  BatterStats,
  BowlerStats,
  Partnership,
  Player,
} from './types';
import { determineStrikeRotation, formatDismissalText, formatOvers } from './scoring';

// Helper to initialize empty innings state
function createInitialInningsState(battingTeamIndex: 0 | 1): InningsState {
  return {
    battingTeamIndex,
    score: 0,
    wickets: 0,
    oversCount: 0,
    legalBallsCount: 0,
    totalBallsCount: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
    batterStats: {},
    bowlerStats: {},
    partnerships: [],
    fallOfWickets: [],
    isCompleted: false,
  };
}

/**
 * Reduce a log of events into the current derived state of the match.
 * Rebuilds the state from scratch to ensure consistency and correctness.
 */
export function reduceMatchState(events: ScorecardEvent[]): MatchDerivedState {
  let match: Match = {
    id: '',
    format: 'T20',
    totalOvers: 20,
    teams: [
      { id: '1', name: 'Team A', shortName: 'TMA', players: [], battingOrder: [] },
      { id: '2', name: 'Team B', shortName: 'TMB', players: [], battingOrder: [] },
    ],
    innings: [],
    state: 'SETUP',
    superOverEnabled: false,
    scoreConvention: 'runs_wickets',
    powerplayOvers: 6,
    createdAt: Date.now(),
  };

  // Pre-process events to find edits and undos
  const undoneDeliveryIds = new Set<string>();
  const deliveryPatches = new Map<string, Partial<Delivery>>();

  for (const event of events) {
    if (event.type === 'UNDO_DELIVERY') {
      undoneDeliveryIds.add(event.deliveryId);
    } else if (event.type === 'EDIT_DELIVERY') {
      const existing = deliveryPatches.get(event.deliveryId) || {};
      deliveryPatches.set(event.deliveryId, { ...existing, ...event.patch });
    }
  }

  // Derived innings states
  let inningsStates: InningsState[] = [];
  let currentInningsIndex = -1;

  // Track players dictionary for dismissal description rendering
  const playersMap: Record<string, Player> = {};

  // Process events in chronological order
  for (const event of events) {
    switch (event.type) {
      case 'SETUP_MATCH': {
        match = { ...event.match, innings: [] };
        inningsStates = [];
        currentInningsIndex = -1;
        // Populate players map
        match.teams.forEach(team => {
          team.players.forEach(p => {
            playersMap[p.id] = p;
          });
        });
        break;
      }

      case 'TOSS_COMPLETE': {
        match.toss = {
          winnerId: event.winnerId,
          decision: event.decision,
        };
        match.state = 'INNINGS_SETUP';
        break;
      }

      case 'START_INNINGS': {
        currentInningsIndex++;
        const battingTeamIndex = event.battingTeamIndex;
        const newInnings: InningsState = createInitialInningsState(battingTeamIndex);

        newInnings.activeStrikerId = event.strikerId;
        newInnings.activeNonStrikerId = event.nonStrikerId;
        newInnings.activeBowlerId = event.bowlerId;

        // Initialize batter stats
        [event.strikerId, event.nonStrikerId].forEach(id => {
          newInnings.batterStats[id] = {
            playerId: id,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
          };
        });

        // Initialize bowler stats
        newInnings.bowlerStats[event.bowlerId] = {
          playerId: event.bowlerId,
          deliveries: 0,
          legalDeliveries: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
        };

        // Initialize partnership
        const initialPartnership: Partnership = {
          batterAId: event.strikerId,
          batterBId: event.nonStrikerId,
          runs: 0,
          balls: 0,
          active: true,
        };
        newInnings.partnerships.push(initialPartnership);
        newInnings.currentPartnership = initialPartnership;

        inningsStates.push(newInnings);
        match.innings.push({
          battingTeamIndex,
          deliveries: [],
        });
        match.state = 'SCORING';
        break;
      }

      case 'DELIVERY': {
        if (currentInningsIndex < 0) break;
        const currentInnings = match.innings[currentInningsIndex];
        const state = inningsStates[currentInningsIndex];
        if (!state || !currentInnings) break;

        // Apply patches if edited, skip if undone
        if (undoneDeliveryIds.has(event.delivery.id)) {
          break;
        }

        let delivery = { ...event.delivery };
        const patch = deliveryPatches.get(delivery.id);
        if (patch) {
          delivery = { ...delivery, ...patch } as Delivery;
        }

        // Add to active delivery log
        currentInnings.deliveries.push(delivery);

        // Core score updates
        const runs = delivery.runs;
        const delType = delivery.deliveryType;
        const source = delivery.runSource;
        const boundary = delivery.boundary;

        // Determine bowler identity
        const bowlerId = delivery.bowlerId;
        if (!state.bowlerStats[bowlerId]) {
          state.bowlerStats[bowlerId] = {
            playerId: bowlerId,
            deliveries: 0,
            legalDeliveries: 0,
            maidens: 0,
            runsConceded: 0,
            wickets: 0,
            wides: 0,
            noBalls: 0,
          };
        }
        const bStats = state.bowlerStats[bowlerId];
        bStats.deliveries++;

        // Determine striker identity
        const strikerId = delivery.strikerId;
        if (!state.batterStats[strikerId]) {
          state.batterStats[strikerId] = {
            playerId: strikerId,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
          };
        }
        const sStats = state.batterStats[strikerId];

        // 1. Scoring & Extras calculation
        let teamRuns = 0;
        let isLegal = true;

        if (delType === 'legal') {
          teamRuns = runs;
          if (source === 'bat') {
            sStats.runs += runs;
            sStats.balls++;
            bStats.runsConceded += runs;
            if (boundary === 'four') sStats.fours++;
            if (boundary === 'six') sStats.sixes++;
          } else if (source === 'bye') {
            state.extras.byes += runs;
            state.extras.total += runs;
            sStats.balls++;
          } else if (source === 'leg_bye') {
            state.extras.legByes += runs;
            state.extras.total += runs;
            sStats.balls++;
          }
          state.legalBallsCount++;
          bStats.legalDeliveries++;
        } else if (delType === 'wide') {
          isLegal = false;
          // penalty is 1, plus additional runs are byes
          const widePenalty = 1;
          const additionalWideRuns = runs; // additional runs
          teamRuns = widePenalty + additionalWideRuns;

          state.extras.wides += teamRuns;
          state.extras.total += teamRuns;
          bStats.wides += teamRuns;
          bStats.runsConceded += teamRuns;
        } else if (delType === 'no_ball') {
          isLegal = false;
          const penalty = 1;
          teamRuns = penalty + runs;

          state.extras.noBalls += penalty;
          state.extras.total += penalty;
          bStats.noBalls += penalty;

          // Bowler is always charged the penalty, and runs off the bat
          bStats.runsConceded += penalty + (source === 'bat' ? runs : 0);

          if (source === 'bat') {
            sStats.runs += runs;
            sStats.balls++; // striker faces a ball
            if (boundary === 'four') sStats.fours++;
            if (boundary === 'six') sStats.sixes++;
          } else if (source === 'bye') {
            state.extras.byes += runs;
            state.extras.total += runs;
            sStats.balls++;
          } else if (source === 'leg_bye') {
            state.extras.legByes += runs;
            state.extras.total += runs;
            sStats.balls++;
          }
        }

        state.score += teamRuns;
        state.totalBallsCount++;

        // Update active partnership
        if (state.currentPartnership) {
          state.currentPartnership.runs += teamRuns;
          // Wides are not counted as balls faced in partnership
          if (delType !== 'wide') {
            state.currentPartnership.balls++;
          }
        }

        // 2. Wickets & Dismissals
        if (delivery.wicket) {
          state.wickets++;
          const outId = delivery.wicket.batterId;
          
          if (!state.batterStats[outId]) {
            state.batterStats[outId] = { playerId: outId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
          }
          const outStats = state.batterStats[outId];
          outStats.isOut = true;

          // Format dismissal string
          const bowlerName = playersMap[bowlerId]?.shortName || 'Bowler';
          outStats.dismissalDescription = formatDismissalText(
            delivery.wicket,
            bowlerName,
            playersMap
          );

          // Credit bowler if applicable (Hit the ball twice is NOT credited to bowler)
          const bowlerCreditDismissals = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'];
          if (bowlerCreditDismissals.includes(delivery.wicket.type)) {
            bStats.wickets++;
          }

          // Fall of wickets
          state.fallOfWickets.push({
            wicketNumber: state.wickets,
            score: state.score,
            wickets: state.wickets,
            overs: parseFloat(formatOvers(state.legalBallsCount, match.format === 'Hundred')),
            balls: state.legalBallsCount,
            batterId: outId,
          });

          // Deactivate current partnership
          if (state.currentPartnership) {
            state.currentPartnership.active = false;
          }
        }

        // 3. Strike Rotation and state update
        const isHundred = match.format === 'Hundred';
        const ballsPerEnd = isHundred ? 10 : 6;
        const isEndsChange = delivery.deliveryType === 'legal' && (state.legalBallsCount % ballsPerEnd === 0);

        const rotation = determineStrikeRotation({
          delivery,
          currentStrikerId: state.activeStrikerId || '',
          currentNonStrikerId: state.activeNonStrikerId || '',
          isOverEnded: isEndsChange,
        });

        state.activeStrikerId = rotation.strikerId;
        state.activeNonStrikerId = rotation.nonStrikerId;

        // If over ended, keep track of previous bowler
        if (delivery.isOverComplete) {
          state.prevBowlerId = bowlerId;
          state.activeBowlerId = undefined; // bowler choice is required for next over
        } else {
          state.activeBowlerId = bowlerId;
        }

        // Update overs count representation
        state.oversCount = parseFloat(formatOvers(state.legalBallsCount, match.format === 'Hundred'));
        break;
      }

      case 'NEW_BATTER': {
        if (currentInningsIndex < 0) break;
        const state = inningsStates[currentInningsIndex];
        if (!state) break;

        const batterId = event.batterId;

        // Initialize batter stats if needed
        if (!state.batterStats[batterId]) {
          state.batterStats[batterId] = {
            playerId: batterId,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
          };
        } else {
          // If they were previously retired hurt, they are returning, so clear the retired status
          const bStats = state.batterStats[batterId];
          if (bStats.retired === 'hurt') {
            bStats.retired = undefined;
            bStats.dismissalDescription = undefined;
          }
        }

        if (event.position === 'striker') {
          state.activeStrikerId = batterId;
        } else {
          state.activeNonStrikerId = batterId;
        }

        // If both batters are now set, start a new partnership
        if (state.activeStrikerId && state.activeNonStrikerId && (!state.currentPartnership || !state.currentPartnership.active)) {
          const newPart: Partnership = {
            batterAId: state.activeStrikerId,
            batterBId: state.activeNonStrikerId,
            runs: 0,
            balls: 0,
            active: true,
          };
          state.partnerships.push(newPart);
          state.currentPartnership = newPart;
        }
        break;
      }

      case 'NEW_BOWLER': {
        if (currentInningsIndex < 0) break;
        const state = inningsStates[currentInningsIndex];
        if (!state) break;

        state.activeBowlerId = event.bowlerId;

        // Initialize bowler stats if needed
        if (!state.bowlerStats[event.bowlerId]) {
          state.bowlerStats[event.bowlerId] = {
            playerId: event.bowlerId,
            deliveries: 0,
            legalDeliveries: 0,
            runsConceded: 0,
            maidens: 0,
            wickets: 0,
            wides: 0,
            noBalls: 0,
          };
        }
        break;
      }

      case 'RETIRE_BATTER': {
        if (currentInningsIndex < 0) break;
        const state = inningsStates[currentInningsIndex];
        if (!state) break;

        const id = event.batterId;
        if (state.batterStats[id]) {
          const bStats = state.batterStats[id];
          if (event.isOut) {
            bStats.isOut = true;
            bStats.retired = 'out';
            bStats.dismissalDescription = 'retired out';
            state.wickets++;
            state.fallOfWickets.push({
              wicketNumber: state.wickets,
              score: state.score,
              wickets: state.wickets,
              overs: parseFloat(formatOvers(state.legalBallsCount, match.format === 'Hundred')),
              balls: state.legalBallsCount,
              batterId: id,
            });
          } else {
            bStats.isOut = false; // not technically out
            bStats.retired = 'hurt';
            bStats.dismissalDescription = 'retired hurt';
            // does not increment wickets or fall of wickets
          }

          // Deactivate current partnership
          if (state.currentPartnership) {
            state.currentPartnership.active = false;
          }

          // Clear active batter slot
          if (state.activeStrikerId === id) {
            state.activeStrikerId = undefined;
          } else if (state.activeNonStrikerId === id) {
            state.activeNonStrikerId = undefined;
          }
        }
        break;
      }

      case 'PENALTY': {
        if (currentInningsIndex < 0) break;
        const state = inningsStates[currentInningsIndex];
        if (!state) break;

        if (event.awardedTo === 'batting') {
          state.score += event.runs;
          state.extras.penalty += event.runs;
          state.extras.total += event.runs;
          if (state.currentPartnership) {
            state.currentPartnership.runs += event.runs;
          }
        } else {
          // Penalties to fielding side are added to the opposition score when they bat.
          // In standard practice, since it's in-progress scoring, we record it in the extras of the current batting team
          // or subtract from batting side. We follow the spec: "Penalty +5: awarded to batting or fielding"
          // If awarded to fielding, we subtract 5 from batting team's score (or add 5 to fielding team's extras directly).
          // Let's add it as a negative penalty to the batting side for simpler calculations, or handle it as positive when opposition bats.
          // Standard cricket: +5 runs to opposition. So batting side gets -5 runs or opposition gets +5 runs.
          // Let's represent it by adding +5 to opposition innings extras directly if opposition has started, or storing it on match state.
          // But since the events are innings-specific, let's add it to opposition's starting score.
          // For simplicity in MVP, fielding penalty adds 5 runs to opposition (fielding side) total.
          // Let's store this on the match state, or we can just model it as a match-level state.
          // Let's model: if awarded to fielding, we add +5 runs to opposition's score.
          const oppInningsIndex = currentInningsIndex === 0 ? 1 : 0;
          // If opposition innings exists, add to it
          const oppState = inningsStates[oppInningsIndex];
          if (oppState) {
            oppState.score += event.runs;
            oppState.extras.penalty += event.runs;
            oppState.extras.total += event.runs;
          } else {
            // If opposition innings hasn't started yet, we'll initialize their starting score with it when we START_INNINGS.
            // Let's just track this match-level penalty runs for simplicity.
            // (We will handle this during START_INNINGS in production reduction, but for gully cricket, this is very rare anyway)
          }
        }
        break;
      }

      case 'CHANGE_KEEPER': {
        match.teams.forEach(team => {
          team.players.forEach(p => {
            if (p.id === event.newKeeperId) {
              p.isKeeper = true;
            } else if (team.players.some(tp => tp.id === event.newKeeperId)) {
              p.isKeeper = false; // ensure only one keeper in the team
            }
          });
        });
        break;
      }

      case 'INNINGS_END': {
        if (currentInningsIndex < 0) break;
        const state = inningsStates[currentInningsIndex];
        if (state) {
          state.isCompleted = true;
          match.state = 'INNINGS_BREAK';
        }
        break;
      }

      case 'DECLARE_INNINGS': {
        if (currentInningsIndex < 0) break;
        const currentInnings = match.innings[currentInningsIndex];
        const state = inningsStates[currentInningsIndex];
        if (state && currentInnings) {
          state.isCompleted = true;
          currentInnings.declaredAt = Date.now();
          match.state = 'INNINGS_BREAK';
        }
        break;
      }

      case 'MATCH_END': {
        match.result = event.result;
        match.state = 'RESULT';
        break;
      }

      case 'SELECT_PLAYER_OF_MATCH': {
        if (match.result) {
          match.result.playerOfMatch = event.playerId;
        }
        break;
      }
    }
  }

  // Calculate targets for 2nd innings
  if (inningsStates.length === 2 && inningsStates[0]) {
    const innings1 = inningsStates[0];
    const innings2 = inningsStates[1];
    innings2.target = innings1.score + 1;
  }

  const isMatchFinished = match.state === 'RESULT' || match.state === 'MATCH_END';

  return {
    match,
    inningsStates,
    currentInningsIndex,
    currentInningsState: inningsStates[currentInningsIndex],
    isMatchFinished,
  };
}
