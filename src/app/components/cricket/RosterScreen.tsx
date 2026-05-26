import React, { useState } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { Player, Team, Match, ScorecardEvent } from '../../../engine/types';
import { generateUUID } from '../../../db/matchStore';
import { Users, Plus, Shield, Trash2, Award } from 'lucide-react';
import { toast } from 'sonner';

interface RosterScreenProps {
  teamIndex: 0 | 1;
}

export const RosterScreen: React.FC<RosterScreenProps> = ({ teamIndex }) => {
  const nav = useNav();
  const { derivedState, startNewMatch, dispatch } = useMatch();

  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [role, setRole] = useState<Player['role']>('bat');
  const [isCaptain, setIsCaptain] = useState<boolean>(false);
  const [isKeeper, setIsKeeper] = useState<boolean>(false);
  const [showSizeWarning, setShowSizeWarning] = useState<boolean>(false);

  if (!derivedState) return null;

  const { match } = derivedState;
  const currentTeam = match.teams[teamIndex];

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      toast.error('Please enter a player name.');
      return;
    }

    const shortNameParts = newPlayerName.trim().split(' ');
    const shortName = shortNameParts.length > 1
      ? `${shortNameParts[0][0]}. ${shortNameParts.slice(1).join(' ')}`
      : newPlayerName.trim();

    const newPlayer: Player = {
      id: generateUUID(),
      name: newPlayerName.trim(),
      shortName,
      role,
      isCaptain,
      isKeeper,
    };

    // If this player is keeper or captain, reset existing flag on other players in team
    const updatedPlayers = currentTeam.players.map(p => {
      let updated = { ...p };
      if (isCaptain && p.isCaptain) updated.isCaptain = false;
      if (isKeeper && p.isKeeper) updated.isKeeper = false;
      return updated;
    });

    updatedPlayers.push(newPlayer);

    const updatedTeam: Team = {
      ...currentTeam,
      players: updatedPlayers,
      battingOrder: updatedPlayers.map(p => p.id),
    };

    const updatedTeams = [...match.teams] as [Team, Team];
    updatedTeams[teamIndex] = updatedTeam;

    const updatedMatch: Match = {
      ...match,
      teams: updatedTeams,
    };

    // Re-dispatch Setup Match to update active match state with new rosters
    startNewMatch(updatedMatch);

    // Reset form states
    setNewPlayerName('');
    setRole('bat');
    setIsCaptain(false);
    setIsKeeper(false);
  };

  const handleToggleCaptain = (playerId: string) => {
    const updatedPlayers = currentTeam.players.map(p => ({
      ...p,
      isCaptain: p.id === playerId ? !p.isCaptain : false, // toggle selection
    }));

    updateTeamPlayers(updatedPlayers);
  };

  const handleToggleKeeper = (playerId: string) => {
    const updatedPlayers = currentTeam.players.map(p => ({
      ...p,
      isKeeper: p.id === playerId ? !p.isKeeper : false, // toggle selection
    }));

    updateTeamPlayers(updatedPlayers);
  };

  const handleRemovePlayer = (playerId: string) => {
    const updatedPlayers = currentTeam.players.filter(p => p.id !== playerId);
    updateTeamPlayers(updatedPlayers);
  };

  const updateTeamPlayers = (players: Player[]) => {
    const updatedTeam: Team = {
      ...currentTeam,
      players,
      battingOrder: players.map(p => p.id),
    };

    const updatedTeams = [...match.teams] as [Team, Team];
    updatedTeams[teamIndex] = updatedTeam;

    const updatedMatch: Match = {
      ...match,
      teams: updatedTeams,
    };

    startNewMatch(updatedMatch);
  };

  const handleDone = () => {
    const minPlayers = 2; // Gully cricket limit
    if (currentTeam.players.length < minPlayers) {
      toast.error(`Please add at least ${minPlayers} players to ${currentTeam.name}.`);
      return;
    }

    if (teamIndex === 0) {
      // Go to Team B Roster Screen
      nav.go({ name: 'roster', teamIndex: 1 });
    } else {
      // Check for equal players between the two teams
      const teamAPlayersCount = match.teams[0].players.length;
      const teamBPlayersCount = match.teams[1].players.length;
      if (teamAPlayersCount !== teamBPlayersCount) {
        setShowSizeWarning(true);
        return;
      }

      // finalize rosters, update status, go to Toss Screen
      nav.go({ name: 'toss' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center justify-between shrink-0">
        <button
          onClick={() => nav.back()}
          className="text-sm font-semibold text-ink-700 hover:text-ink-900 cursor-pointer"
        >
          Back
        </button>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-ink-900 leading-none truncate max-w-[180px]">
            Roster: {currentTeam.name}
          </span>
          <span className="text-[9px] text-pitch-700 font-extrabold uppercase tracking-widest mt-1">
            {teamIndex === 0 ? 'Step 2 of 5' : 'Step 3 of 5'}
          </span>
        </div>
        <button
          onClick={handleDone}
          className="text-sm font-bold text-pitch-700 hover:text-pitch-600 cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Roster Listing Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Subheader summary stats */}
        <div className="flex items-center justify-between text-xs font-semibold text-ink-700 bg-card px-3 py-2 rounded-xl border border-ink-200 shadow-sm shrink-0">
          <span className="flex items-center gap-1">
            <Users size={14} className="text-pitch-700" />
            Roster: <strong>{currentTeam.players.length} players</strong>
          </span>
          {currentTeam.players.length < 2 && (
            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
              Min 2 required
            </span>
          )}
        </div>

        {/* Players List */}
        <div className="space-y-2">
          {currentTeam.players.length === 0 ? (
            <div className="border-2 border-dashed border-ink-200 rounded-2xl py-10 text-center text-xs text-ink-400 font-medium bg-card">
              No players added to this roster yet.
            </div>
          ) : (
            currentTeam.players.map((player, idx) => (
              <div
                key={player.id}
                className="bg-card border border-ink-200 rounded-xl p-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-pitch-100 text-pitch-700 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-ink-900 text-sm block truncate">
                      {player.name}
                    </span>
                    <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block">
                      Role: {player.role === 'all' ? 'All-Rounder' : player.role === 'wk' ? 'Wkt Keeper' : player.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Captain Toggle */}
                  <button
                    onClick={() => handleToggleCaptain(player.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      player.isCaptain
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-card text-ink-400 border-ink-200 hover:text-amber-600'
                    }`}
                    title="Set Captain"
                  >
                    <Award size={15} />
                  </button>

                  {/* Keeper Toggle */}
                  <button
                    onClick={() => handleToggleKeeper(player.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      player.isKeeper
                        ? 'bg-pitch-700 text-white border-pitch-700'
                        : 'bg-card text-ink-400 border-ink-200 hover:text-pitch-700'
                    }`}
                    title="Set Keeper"
                  >
                    <Shield size={15} />
                  </button>

                  {/* Delete Player */}
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    title="Remove Player"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Player Box at bottom */}
      <div className="bg-card border-t border-ink-200 p-4 shrink-0 flex flex-col gap-3 shadow-inner">
        <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Add Player</span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Player Name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            className="flex-1 bg-ink-100 border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-900 font-semibold focus:outline-none focus:border-pitch-700"
          />
          <button
            onClick={handleAddPlayer}
            className="px-4 bg-pitch-700 text-white rounded-xl font-semibold text-sm flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Roles & Details row */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex bg-ink-50 p-0.5 rounded-lg border border-ink-100 flex-1">
            {(['bat', 'bowl', 'all', 'wk'] as Player['role'][]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  role === r ? 'bg-pitch-700 text-white shadow-sm' : 'text-ink-700 hover:bg-ink-100'
                }`}
              >
                {r === 'wk' ? 'wk' : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCaptain(!isCaptain)}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                isCaptain ? 'bg-amber-600 text-white border-amber-600' : 'bg-card text-ink-400 border-ink-200'
              }`}
            >
              C
            </button>
            <button
              onClick={() => setIsKeeper(!isKeeper)}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                isKeeper ? 'bg-pitch-700 text-white border-pitch-700' : 'bg-card text-ink-400 border-ink-200'
              }`}
            >
              WK
            </button>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-card border-t border-ink-100 shrink-0">
        <button
          onClick={handleDone}
          className="w-full py-3 bg-pitch-700 text-white text-sm font-semibold rounded-xl hover:bg-pitch-600 active:scale-98 transition-transform shadow-md cursor-pointer text-center"
        >
          {teamIndex === 0 ? 'Save & Set Up Team B →' : 'Done & Proceed to Toss →'}
        </button>
      </div>

      {/* Unequal player warning dialog overlay */}
      {showSizeWarning && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fadein_120ms_ease] px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSizeWarning(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl space-y-4 animate-[popin_220ms_cubic-bezier(0.2,0,0,1)] z-10">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-ink-900">
                Unequal Team Sizes
              </h3>
              <p className="text-xs text-ink-600 font-medium leading-relaxed">
                {match.teams[0].name} has {match.teams[0].players.length} players, but {match.teams[1].name} has {match.teams[1].players.length} players. Are you sure you want to proceed?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSizeWarning(false)}
                className="flex-1 py-2.5 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 hover:bg-ink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSizeWarning(false);
                  nav.go({ name: 'toss' });
                }}
                className="flex-1 py-2.5 bg-pitch-700 text-white rounded-xl text-xs font-black hover:bg-pitch-600 cursor-pointer shadow-sm animate-pulse"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RosterScreen;
