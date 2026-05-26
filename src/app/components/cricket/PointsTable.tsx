import { ArrowLeft, Info } from "lucide-react";
import { table } from "./data";
import { useNav } from "./nav";

export function PointsTable() {
  const nav = useNav();
  return (
    <div className="flex flex-col h-full bg-[var(--ink-50)] overflow-y-auto">
      <div className="px-3 py-3 flex items-center bg-[var(--card)] border-b border-[var(--ink-200)] safe-top">
        <button onClick={nav.back} className="p-1 -ml-1 text-[var(--ink-700)] active:opacity-60"><ArrowLeft size={20} /></button>
        <div className="ml-1 flex-1">
          <div className="text-[15px] font-bold text-[var(--ink-900)]">Summer Cup 2026</div>
          <div className="text-[11px] text-[var(--ink-400)]">Points Table · League stage</div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="flex gap-2 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-2 h-3 rounded-sm bg-[var(--pitch-700)]" /> Qualified</span>
          <span className="flex items-center gap-1"><span className="w-2 h-3 rounded-sm bg-[var(--amber-600)]" /> Playoff</span>
          <span className="flex items-center gap-1"><span className="w-2 h-3 rounded-sm bg-[var(--ink-200)]" /> Eliminated</span>
        </div>
      </div>

      <div className="mt-3 mx-3 rounded-xl overflow-hidden border border-[var(--ink-200)] bg-[var(--card)]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--ink-100)] text-[var(--ink-700)] text-[10px] uppercase tracking-wider">
              <th className="text-left pl-3 py-2 font-semibold">#</th>
              <th className="text-left py-2 font-semibold">Team</th>
              <th className="px-1.5 py-2 font-semibold tabular-nums text-right">P</th>
              <th className="px-1.5 py-2 font-semibold tabular-nums text-right">W</th>
              <th className="px-1.5 py-2 font-semibold tabular-nums text-right">L</th>
              <th className="px-1.5 py-2 font-semibold tabular-nums text-right">NRR</th>
              <th className="pr-3 py-2 font-semibold tabular-nums text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => {
              const border =
                r.status === "Q" ? "var(--pitch-700)" : r.status === "P" ? "var(--amber-600)" : "var(--ink-200)";
              return (
                <tr
                  key={r.team}
                  className={`border-b border-[var(--ink-100)] ${r.status === "E" ? "text-[var(--ink-400)]" : "text-[var(--ink-900)]"}`}
                  style={{ boxShadow: `inset 3px 0 0 0 ${border}` }}
                >
                  <td className="pl-3 py-2.5 font-mono tabular-nums">{r.pos}</td>
                  <td className="py-2.5 font-semibold">{r.team}</td>
                  <td className="px-1.5 py-2.5 text-right font-mono tabular-nums">{r.p}</td>
                  <td className="px-1.5 py-2.5 text-right font-mono tabular-nums">{r.w}</td>
                  <td className="px-1.5 py-2.5 text-right font-mono tabular-nums">{r.l}</td>
                  <td className={`px-1.5 py-2.5 text-right font-mono tabular-nums ${r.nrr >= 0 ? "text-[var(--pitch-700)]" : "text-[var(--red-600)]"}`}>
                    {r.nrr >= 0 ? "+" : ""}{r.nrr.toFixed(2)}
                  </td>
                  <td className="pr-3 py-2.5 text-right font-mono font-bold tabular-nums">{r.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mx-3 mt-3 rounded-lg bg-[var(--card)] border border-[var(--ink-200)] p-3 flex gap-2 items-start">
        <Info size={14} className="text-[var(--ink-700)] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[var(--ink-700)] leading-relaxed">
          <span className="font-semibold text-[var(--ink-900)]">NRR =</span> (runs scored ÷ overs faced) − (runs conceded ÷ overs bowled),
          taken over the full quota of overs. An all-out side counts the full quota.
        </div>
      </div>

      <div className="mx-3 mt-3 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full bg-[var(--blue-100)] text-[var(--blue-600)] text-[11px] font-semibold">4 matches remaining</span>
      </div>

      <div className="flex-1" />
    </div>
  );
}
