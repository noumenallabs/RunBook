import React from "react";
import { ArrowLeft, Info, Trophy } from "lucide-react";
import { useNav } from "./nav";
import { useMatch } from "../../../hooks/useMatch";
import { Match, Innings } from "../../../engine/types";

interface TeamStats {
  pos: number;
  team: string;
  p: number;
  w: number;
  l: number;
  nr: number;
  pts: number;
  status: "Q" | "P" | "E" | "";
  runsScored: number;
  ballsFaced: number; 
  runsConceded: number;
  ballsBowled: number;
}

// Baseline starting statistics for the 6 default cup teams (after 8 games played)
const BASELINE_TEAMS: Record<string, TeamStats> = {
  "Mumbai Strikers": { pos: 1, team: "Mumbai Strikers", p: 8, w: 6, l: 2, nr: 0, pts: 12, status: "Q", runsScored: 1250, ballsFaced: 160 * 6, runsConceded: 1050, ballsBowled: 159 * 6 },
  "Chennai Chargers": { pos: 2, team: "Chennai Chargers", p: 8, w: 5, l: 2, nr: 1, pts: 11, status: "Q", runsScored: 1180, ballsFaced: 155 * 6, runsConceded: 1050, ballsBowled: 155 * 6 },
  "Delhi Daredevils": { pos: 3, team: "Delhi Daredevils", p: 8, w: 5, l: 3, nr: 0, pts: 10, status: "P", runsScored: 1120, ballsFaced: 158 * 6, runsConceded: 1100, ballsBowled: 158 * 6 },
  "Bengaluru Royals": { pos: 4, team: "Bengaluru Royals", p: 8, w: 4, l: 4, nr: 0, pts: 8, status: "P", runsScored: 1080, ballsFaced: 160 * 6, runsConceded: 1090, ballsBowled: 160 * 6 },
  "Kolkata Knights": { pos: 5, team: "Kolkata Knights", p: 8, w: 3, l: 5, nr: 0, pts: 6, status: "E", runsScored: 1040, ballsFaced: 158 * 6, runsConceded: 1095, ballsBowled: 158 * 6 },
  "Punjab Panthers": { pos: 6, team: "Punjab Panthers", p: 8, w: 1, l: 7, nr: 0, pts: 2, status: "E", runsScored: 920, ballsFaced: 160 * 6, runsConceded: 1180, ballsBowled: 160 * 6 }
};

export const PointsTable: React.FC = () => {
  const nav = useNav();
  const { recentMatches } = useMatch();

  // 1. Gather all completed matches from DB
  const completedMatches = recentMatches.filter(
    (m) => m.state === "RESULT" || m.result !== undefined
  );

  // 2. Clone baseline teams or discover dynamically
  const standings: Record<string, TeamStats> = JSON.parse(JSON.stringify(BASELINE_TEAMS));

  // Helper to calculate runs, legal balls, wickets, and all-out status from an innings
  const getInningsSummary = (match: Match, inningsIndex: number) => {
    const innings = match.innings[inningsIndex];
    if (!innings) return { runs: 0, balls: 0, wickets: 0, allOut: false };

    let runs = 0;
    let legalBalls = 0;
    let wickets = 0;

    innings.deliveries.forEach((d) => {
      runs += d.runs;
      if (d.deliveryType === "wide" || d.deliveryType === "no_ball") {
        runs += 1; // 1 extra for wide / no-ball
      } else {
        legalBalls += 1;
      }
      if (d.wicket && d.wicket.type !== "retired_hurt") {
        wickets += 1;
      }
    });

    const battingTeamIndex = innings.battingTeamIndex;
    const totalPlayers = match.teams[battingTeamIndex]?.players?.length || 11;
    const allOut = wickets >= (totalPlayers - 1);

    return { runs, balls: legalBalls, wickets, allOut };
  };

  // 3. Process completed matches
  completedMatches.forEach((match) => {
    const team0 = match.teams[0];
    const team1 = match.teams[1];

    if (!team0 || !team1) return;

    // Ensure teams exist in standings (e.g. if user created custom team names)
    [team0.name, team1.name].forEach((name) => {
      if (!standings[name]) {
        standings[name] = {
          pos: 99,
          team: name,
          p: 0,
          w: 0,
          l: 0,
          nr: 0,
          pts: 0,
          status: "",
          runsScored: 0,
          ballsFaced: 0,
          runsConceded: 0,
          ballsBowled: 0,
        };
      }
    });

    const stats0 = standings[team0.name];
    const stats1 = standings[team1.name];

    // Determine Innings index for who batted when
    // Innings 0 is index 0, Innings 1 is index 1
    const summary0 = getInningsSummary(match, 0);
    const summary1 = getInningsSummary(match, 1);

    // Identify which summary belongs to which team
    const teamIndex0 = match.innings[0]?.battingTeamIndex ?? 0;
    const summaryTeam0 = teamIndex0 === 0 ? summary0 : summary1;
    const summaryTeam1 = teamIndex0 === 0 ? summary1 : summary0;

    // Played increment
    stats0.p += 1;
    stats1.p += 1;

    // Win / Loss / Points Allocation
    if (match.result) {
      if (match.result.type === "tie" || match.result.type === "no_result") {
        stats0.nr += 1;
        stats1.nr += 1;
        stats0.pts += 1;
        stats1.pts += 1;
      } else if (match.result.winnerId === team0.id) {
        stats0.w += 1;
        stats1.l += 1;
        stats0.pts += 2;
      } else if (match.result.winnerId === team1.id) {
        stats1.w += 1;
        stats0.l += 1;
        stats1.pts += 2;
      }
    }

    // NRR Accumulation (Runs/Balls faced and conceded)
    const totalOversBalls = match.totalOvers * 6;

    // Team 0 batting stats
    stats0.runsScored += summaryTeam0.runs;
    stats0.ballsFaced += summaryTeam0.allOut ? totalOversBalls : summaryTeam0.balls;

    // Team 0 bowling stats (what opponent Team 1 scored)
    stats0.runsConceded += summaryTeam1.runs;
    stats0.ballsBowled += summaryTeam1.allOut ? totalOversBalls : summaryTeam1.balls;

    // Team 1 batting stats
    stats1.runsScored += summaryTeam1.runs;
    stats1.ballsFaced += summaryTeam1.allOut ? totalOversBalls : summaryTeam1.balls;

    // Team 1 bowling stats (what opponent Team 0 scored)
    stats1.runsConceded += summaryTeam0.runs;
    stats1.ballsBowled += summaryTeam0.allOut ? totalOversBalls : summaryTeam0.balls;
  });

  // 4. Calculate Net Run Rate and sort standings
  const sortedTable = Object.values(standings).map((row) => {
    // NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
    // Avoid divide-by-zero
    const oversFaced = row.ballsFaced > 0 ? row.ballsFaced / 6 : 0;
    const oversBowled = row.ballsBowled > 0 ? row.ballsBowled / 6 : 0;

    const rpoScored = oversFaced > 0 ? row.runsScored / oversFaced : 0;
    const rpoConceded = oversBowled > 0 ? row.runsConceded / oversBowled : 0;
    const nrr = rpoScored - rpoConceded;

    return { ...row, nrr };
  });

  // Sort: Points DESC, NRR DESC, Wins DESC, Name ASC
  sortedTable.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    if (b.w !== a.w) return b.w - a.w;
    return a.team.localeCompare(b.team);
  });

  // 5. Re-assign positions and status formatting Q / P / E
  const finalTable = sortedTable.map((row, idx) => {
    const pos = idx + 1;
    let status: "Q" | "P" | "E" | "" = "";
    if (pos <= 2) status = "Q";
    else if (pos <= 4) status = "P";
    else status = "E";

    return {
      ...row,
      pos,
      status,
    };
  });

  return (
    <div className="flex flex-col h-full bg-ink-50 overflow-y-auto select-none animate-[fadein_120ms_ease]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center bg-card border-b border-ink-200 shrink-0">
        <button 
          onClick={() => nav.back()} 
          className="p-1 -ml-1 text-ink-700 hover:text-ink-900 cursor-pointer rounded-lg hover:bg-ink-100 transition-colors"
          aria-label="Go Back"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="ml-2 flex-1">
          <div className="text-base font-bold text-ink-900 flex items-center gap-1.5">
            <Trophy size={16} className="text-pitch-700" />
            <span>Summer Cup 2026</span>
          </div>
          <div className="text-[10px] text-ink-400 font-bold uppercase tracking-wider">Points Table · League stage</div>
        </div>
      </div>

      {/* Qualification Legend */}
      <div className="px-4 pt-3 flex gap-3 text-[10px] font-semibold">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-pitch-700" /> Qualified</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Playoff</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-ink-200" /> Eliminated</span>
      </div>

      {/* Standings Table Card */}
      <div className="mt-3 mx-4 rounded-2xl overflow-hidden border border-ink-200 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-ink-100 text-ink-400 text-[10px] uppercase font-bold tracking-wider border-b border-ink-200">
                <th className="text-left pl-4 py-3 w-8 font-bold">#</th>
                <th className="text-left py-3 font-bold min-w-[120px]">Team</th>
                <th className="px-2 py-3 font-bold text-right w-10">P</th>
                <th className="px-2 py-3 font-bold text-right w-10">W</th>
                <th className="px-2 py-3 font-bold text-right w-10">L</th>
                <th className="px-2 py-3 font-bold text-right w-16">NRR</th>
                <th className="pr-4 py-3 font-bold text-right w-12">Pts</th>
              </tr>
            </thead>
            <tbody>
              {finalTable.map((r) => {
                const border =
                  r.status === "Q" 
                    ? "var(--pitch-700)" 
                    : r.status === "P" 
                      ? "var(--amber-500)" 
                      : "var(--ink-200)";
                return (
                  <tr
                    key={r.team}
                    className={`border-b border-ink-100 last:border-0 hover:bg-ink-100/30 transition-colors ${
                      r.status === "E" ? "text-ink-400" : "text-ink-900"
                    }`}
                    style={{ boxShadow: `inset 3.5px 0 0 0 ${border}` }}
                  >
                    <td className="pl-4 py-3.5 font-mono font-semibold tabular-nums">{r.pos}</td>
                    <td className="py-3.5 font-bold truncate max-w-[140px]">{r.team}</td>
                    <td className="px-2 py-3.5 text-right font-mono font-medium tabular-nums">{r.p}</td>
                    <td className="px-2 py-3.5 text-right font-mono font-medium tabular-nums">{r.w}</td>
                    <td className="px-2 py-3.5 text-right font-mono font-medium tabular-nums">{r.l}</td>
                    <td className={`px-2 py-3.5 text-right font-mono font-semibold tabular-nums ${
                      r.nrr >= 0 ? "text-pitch-700 dark:text-pitch-400" : "text-red-600"
                    }`}>
                      {r.nrr >= 0 ? "+" : ""}{r.nrr.toFixed(2)}
                    </td>
                    <td className="pr-4 py-3.5 text-right font-mono font-black tabular-nums">{r.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NRR Explanation Card */}
      <div className="mx-4 mt-4 rounded-2xl bg-card border border-ink-200 p-4 shadow-sm flex gap-3 items-start">
        <Info size={16} className="text-pitch-700 shrink-0 mt-0.5" />
        <div className="text-[11px] text-ink-550 leading-relaxed font-medium">
          <span className="font-bold text-ink-900 block mb-0.5">How Net Run Rate (NRR) is calculated:</span>
          NRR = (runs scored ÷ overs faced) − (runs conceded ÷ overs bowled). If a team is dismissed all out, the calculations count the full quota of overs allocated in the match format.
        </div>
      </div>

      {/* Dynamic matches remaining status */}
      <div className="mx-4 mt-4 flex items-center gap-2 mb-6">
        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/30">
          {completedMatches.length} Dynamic Matches Logged
        </span>
      </div>

      <div className="flex-1" />
    </div>
  );
};
export default PointsTable;
