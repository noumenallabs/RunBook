import { useMatch } from './useMatch';
import { Delivery, DismissalType, ScorecardEvent, MatchDerivedState } from '../engine/types';
import { generateUUID } from '../db/matchStore';

export const useScoring = () => {
  const { derivedState, dispatch, undo } = useMatch();

  const recordBall = async (params: {
    deliveryType: 'legal' | 'wide' | 'no_ball';
    runs: number;
    runSource: 'bat' | 'bye' | 'leg_bye' | 'penalty';
    boundary: 'none' | 'four' | 'six';
    wicket?: Delivery['wicket'];
  }) => {
    if (!derivedState || !derivedState.currentInningsState) return;

    const { currentInningsState, match, currentInningsIndex } = derivedState;
    const { activeStrikerId, activeNonStrikerId, activeBowlerId } = currentInningsState;

    if (!activeStrikerId || !activeNonStrikerId || !activeBowlerId) {
      console.warn('Cannot record ball: striker, non-striker, or bowler is missing');
      return;
    }

    const isHundred = match.format === 'Hundred';
    const ballsPerOver = isHundred ? 5 : 6;

    // Check if the previous delivery was a no_ball to determine if this is a free hit
    let isFreeHit = false;
    const activeInnings = match.innings[currentInningsIndex];
    if (activeInnings && activeInnings.deliveries.length > 0) {
      const lastDel = activeInnings.deliveries[activeInnings.deliveries.length - 1];
      if (lastDel.deliveryType === 'no_ball') {
        isFreeHit = true;
      } else if (lastDel.isFreeHit && (lastDel.deliveryType === 'wide' || lastDel.deliveryType === 'no_ball')) {
        // Free hit carries over if the free hit ball was a wide or no-ball
        isFreeHit = true;
      }
    }

    // Determine ball in over position
    const ballInOver = currentInningsState.legalBallsCount % ballsPerOver;
    const overNumber = Math.floor(currentInningsState.legalBallsCount / ballsPerOver);

    // Is over complete (meaning this is the last legal ball of the over/set)
    const isLegal = params.deliveryType === 'legal';
    const isOverComplete = isLegal && ballInOver === (ballsPerOver - 1);

    const delivery: Delivery = {
      id: generateUUID(),
      matchId: match.id,
      inningsIndex: currentInningsIndex as 0 | 1,
      overNumber,
      ballInOver,
      timestamp: Date.now(),
      deliveryType: params.deliveryType,
      runs: params.runs,
      runSource: params.runSource,
      boundary: params.boundary,
      wicket: params.wicket,
      strikerId: activeStrikerId,
      nonStrikerId: activeNonStrikerId,
      bowlerId: activeBowlerId,
      isFreeHit,
      isOverComplete,
    };

    await dispatch({
      type: 'DELIVERY',
      delivery,
    });

    // Check if innings ended (all out or overs quota reached)
    // Runs and wickets updates are processed in the reducer, so we evaluate the NEXT state.
    // However, we can also dispatch INNINGS_END or let the reducer handle state transitions.
    // For simplicity, we trigger innings break check after dispatching.
    // In our event-sourced model, let's verify if innings-ending conditions are met.
  };

  const selectBowler = async (bowlerId: string) => {
    await dispatch({
      type: 'NEW_BOWLER',
      bowlerId,
    });
  };

  const selectBatter = async (batterId: string, position: 'striker' | 'non_striker') => {
    await dispatch({
      type: 'NEW_BATTER',
      batterId,
      position,
    });
  };

  const retireBatter = async (batterId: string, isOut: boolean) => {
    await dispatch({
      type: 'RETIRE_BATTER',
      batterId,
      isOut,
    });
  };

  const declareInnings = async () => {
    await dispatch({
      type: 'DECLARE_INNINGS',
    });
  };

  const recordPenalty = async (runs: number, awardedTo: 'batting' | 'fielding') => {
    await dispatch({
      type: 'PENALTY',
      runs,
      awardedTo,
    });
  };

  const editBall = async (deliveryId: string, patch: Partial<Delivery>, reason: string) => {
    await dispatch({
      type: 'EDIT_DELIVERY',
      deliveryId,
      patch,
      reason,
    });
  };

  const endInnings = async (reason: 'all_out' | 'overs_done' | 'declared' | 'target_reached') => {
    await dispatch({
      type: 'INNINGS_END',
      reason,
    });
  };

  const endMatch = async (winnerId?: string, type: 'runs' | 'wickets' | 'tie' | 'no_result' = 'runs', margin?: number) => {
    const battingTeamName = derivedState?.match.teams[derivedState.currentInningsState?.battingTeamIndex ?? 0].name ?? 'Team';
    const oppositionTeamName = derivedState?.match.teams[derivedState.currentInningsState?.battingTeamIndex === 0 ? 1 : 0].name ?? 'Team';
    
    let description = 'Match ended';
    if (type === 'runs' && winnerId) {
      const winnerName = derivedState?.match.teams[derivedState.match.teams[0].id === winnerId ? 0 : 1].name;
      description = `${winnerName} won by ${margin} runs`;
    } else if (type === 'wickets' && winnerId) {
      const winnerName = derivedState?.match.teams[derivedState.match.teams[0].id === winnerId ? 0 : 1].name;
      description = `${winnerName} won by ${margin} wickets`;
    } else if (type === 'tie') {
      description = 'Match tied';
    } else if (type === 'no_result') {
      description = 'Match ended with no result';
    }

    await dispatch({
      type: 'MATCH_END',
      result: {
        winnerId,
        type,
        margin,
        description,
      },
    });
  };

  return {
    recordBall,
    selectBowler,
    selectBatter,
    retireBatter,
    declareInnings,
    recordPenalty,
    editBall,
    endInnings,
    endMatch,
    undo,
  };
};
