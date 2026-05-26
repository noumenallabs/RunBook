import React, { useState, useEffect } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { Player } from '../../../engine/types';
import { Award, Share2, Plus, Home } from 'lucide-react';

interface PlayerPerformance {
  player: Player;
  runs: number;
  balls: number;
  wickets: number;
  runsConceded: number;
  catches: number;
  points: number;
}

export const MatchResult: React.FC = () => {
  const nav = useNav();
  const { derivedState, dispatch } = useMatch();
  const [selectedPomId, setSelectedPomId] = useState<string>('');

  useEffect(() => {
    if (derivedState?.match.result?.playerOfMatch) {
      setSelectedPomId(derivedState.match.result.playerOfMatch);
    }
  }, [derivedState]);

  if (!derivedState || !derivedState.match.result) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-ink-50">
        <span className="text-sm font-semibold text-ink-700">No match result found</span>
      </div>
    );
  }

  const { match, inningsStates } = derivedState;
  const result = match.result;

  // 1. Calculate Player of the Match suggestions
  const playersPerformance: Record<string, PlayerPerformance> = {};
  
  // Initialize map
  match.teams.forEach(team => {
    team.players.forEach(p => {
      playersPerformance[p.id] = {
        player: p,
        runs: 0,
        balls: 0,
        wickets: 0,
        runsConceded: 0,
        catches: 0,
        points: 0,
      };
    });
  });

  // Tally runs & wickets
  inningsStates.forEach(innState => {
    // Batting stats
    Object.values(innState.batterStats).forEach(b => {
      if (playersPerformance[b.playerId]) {
        playersPerformance[b.playerId].runs += b.runs;
        playersPerformance[b.playerId].balls += b.balls;
      }
    });

    // Bowling stats
    Object.values(innState.bowlerStats).forEach(b => {
      if (playersPerformance[b.playerId]) {
        playersPerformance[b.playerId].wickets += b.wickets;
        playersPerformance[b.playerId].runsConceded += b.runsConceded;
      }
    });
  });

  // Tally catches and stumpings from raw deliveries
  match.innings.forEach(innings => {
    innings.deliveries.forEach(d => {
      if (d.wicket && d.wicket.fielderId && playersPerformance[d.wicket.fielderId]) {
        playersPerformance[d.wicket.fielderId].catches++;
      }
    });
  });

  // Calculate points: runs + 2*wickets + 0.5*catches
  Object.values(playersPerformance).forEach(perf => {
    perf.points = perf.runs + (perf.wickets * 12) + (perf.catches * 4); // Standard points weight
  });

  const rankedPerformances = Object.values(playersPerformance)
    .sort((a, b) => b.points - a.points)
    .filter(p => p.points > 0);

  const top3Suggestions = rankedPerformances.slice(0, 3);

  const handlePomSelect = async (playerId: string) => {
    setSelectedPomId(playerId);
    await dispatch({
      type: 'SELECT_PLAYER_OF_MATCH',
      playerId,
    });
  };

  const handleShare = () => {
    const shareText = `🏏 RunBook Match Result! 🏏\n\n${match.teams[0].name} VS ${match.teams[1].name}\n\n🏆 Result: ${result.description}\n\nScored on RunBook App.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'RunBook Match Scorecard',
        text: shareText,
      }).catch(err => console.log('Share failed', err));
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Scorecard result copied to clipboard!');
      });
    }
  };

  const pomPlayer = selectedPomId ? playersMap(match)[selectedPomId] : null;

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none overflow-y-auto">
      {/* Trophy Section */}
      <div className="bg-gradient-to-b from-pitch-100 to-ink-50 py-8 px-4 flex flex-col items-center justify-center shrink-0 border-b border-ink-200">
        {/* Simple celebratory animation */}
        <div className="w-20 h-20 bg-amber-100 border border-amber-600/30 rounded-full flex items-center justify-center text-3xl shadow-md animate-bounce mb-3">
          🏆
        </div>
        <span className="text-[10px] uppercase font-black tracking-widest text-pitch-700 block mb-1">
          Winner
        </span>
        <span className="text-xl font-black text-ink-900 text-center truncate max-w-[300px]">
          {result.winnerId ? match.teams.find(t => t.id === result.winnerId)?.name : 'Match Tied'}
        </span>
        <span className="text-xs text-ink-700 font-semibold text-center mt-2.5 bg-card border border-ink-200 rounded-full px-4 py-1 shadow-sm">
          {result.description}
        </span>
      </div>

      {/* Main Results Info */}
      <div className="p-4 space-y-4 flex-1">
        {/* S1: Player of the match card */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-ink-100 pb-2">
            <Award size={18} className="text-amber-600" />
            <span className="text-xs font-bold text-ink-900">Player of the Match</span>
          </div>

          {/* POM Display */}
          {pomPlayer ? (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shadow-inner">
                🏅
              </div>
              <div className="min-w-0">
                <span className="font-bold text-ink-900 text-sm block truncate">{pomPlayer.name}</span>
                <span className="text-[10px] text-ink-600 font-semibold block uppercase">
                  Performance: {playersPerformance[pomPlayer.id] ? (
                    `${playersPerformance[pomPlayer.id].runs} runs, ${playersPerformance[pomPlayer.id].wickets} wickets`
                  ) : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink-400 font-medium italic text-center py-2">
              Select a player to award Player of the Match
            </div>
          )}

          {/* Top Suggestions */}
          {top3Suggestions.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider block">
                Suggested Candidates
              </span>
              <div className="grid grid-cols-3 gap-2">
                {top3Suggestions.map(perf => (
                  <button
                    key={perf.player.id}
                    onClick={() => handlePomSelect(perf.player.id)}
                    className={`p-2 border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[72px] transition-all ${
                      selectedPomId === perf.player.id
                        ? 'bg-amber-100 border-amber-600 text-amber-700 font-bold ring-1 ring-amber-500'
                        : 'bg-card border-ink-200 hover:border-amber-600 text-ink-700'
                    }`}
                  >
                    <span className="text-xs font-bold block truncate max-w-full leading-tight">
                      {perf.player.shortName}
                    </span>
                    <span className="text-[9px] font-bold text-ink-400 uppercase tracking-wider block mt-1">
                      {perf.runs}R / {perf.wickets}W
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full Team Roster Selector override */}
          <div className="space-y-1 pt-1.5">
            <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider block">
              Or pick any player
            </span>
            <select
              value={selectedPomId}
              onChange={(e) => handlePomSelect(e.target.value)}
              className="w-full bg-ink-100 border border-ink-200 rounded-xl px-3 py-2 text-xs text-ink-900 font-semibold focus:outline-none focus:border-pitch-700 cursor-pointer"
            >
              <option value="" disabled>Choose Player</option>
              {match.teams.flatMap(t => t.players).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({match.teams.find(t => t.players.includes(p))?.shortName})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div className="p-4 bg-card border-t border-ink-200 shrink-0 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {/* Share */}
          <button
            onClick={handleShare}
            className="py-3 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 flex items-center justify-center gap-1 bg-card hover:bg-ink-100 active:scale-98 transition-transform cursor-pointer shadow-sm"
          >
            <Share2 size={15} /> Share Result
          </button>
          
          {/* View Scorecard */}
          <button
            onClick={() => nav.go({ name: 'scorecard' })}
            className="py-3 border border-pitch-700 rounded-xl text-xs font-bold text-pitch-700 flex items-center justify-center gap-1 bg-pitch-100/35 hover:bg-pitch-100 active:scale-98 transition-transform cursor-pointer shadow-sm"
          >
            View Full Scorecard
          </button>
        </div>

        {/* Exit Home */}
        <button
          onClick={() => nav.go({ name: 'home' })}
          className="w-full py-3 rounded-xl bg-pitch-700 text-white text-xs font-bold active:scale-98 transition-transform shadow-md cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Home size={15} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// Helper mapper for player map dictionary lookup
function playersMap(match: Match): Record<string, Player> {
  const map: Record<string, Player> = {};
  match.teams.forEach(t => t.players.forEach(p => { map[p.id] = p; }));
  return map;
}
export default MatchResult;
