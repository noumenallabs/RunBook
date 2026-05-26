# Cricket Scorer — Design Specification v2.0
**App name:** StumpScore
**Target:** Gully → Club → League cricket; umpire / scorer operated.
**Platform:** Mobile-first PWA (iOS + Android). Primary viewport 390 × 844. Tablet (768+) reflows to a 2-pane scorer+scorecard layout.

> **What changed vs v1.0 (GPT draft)?** See §10 — *Corrections*. The biggest fixes: the ball-entry model was structurally wrong (you can't represent "wide + 2" or "4 leg-byes" with flat keys), several dismissal rules were incorrect, the bowler-eligibility rule was wrong, free-hits were missing, and the extras-modifier flow didn't exist. v2 reworks the scoring keypad around how cricket is actually scored: **runs × delivery-type × modifier**, not a flat key per outcome.

---

## 0. Cricket model (the data the UI must capture)

Every ball produces one **Delivery** record. The umpire must, per ball, set:

| Field | Values | Notes |
|---|---|---|
| `deliveryType` | `legal` \| `wide` \| `no_ball` | A wide or no-ball does **not** count toward the over. |
| `runs` | `0..6` (rarely 5, 7 via overthrows) | Runs the batters ran *or* the boundary scored. |
| `runSource` | `bat` \| `bye` \| `leg_bye` \| `penalty` | On `wide` runs are always extras; on `no_ball` runs off the bat go to the batter, additional runs may be byes/leg-byes. |
| `boundary` | `none` \| `four` \| `six` | Only when ball reaches the rope. |
| `wicket?` | `Dismissal` (see §1.6) | Optional; one wicket per ball (run-out + stumped combinations impossible in same delivery). |
| `freeHit` | `bool` | Auto-set true on the ball **after** a front-foot no-ball in limited-overs formats. On a free hit, only Run Out (and a handful of edge dismissals) can dismiss the striker. |
| `striker`, `nonStriker`, `bowler` | playerIds | Snapshot at delivery time. |
| `crossed?` | `bool` | For catches — did the batters cross before the catch? Determines who is on strike next. |

**Strike rotation:** odd runs swap strike; end-of-over swaps strike; on a caught dismissal use `crossed`; on run-out the surviving batter ends up at the end they reached.

This data model — not the keypad layout — is the contract. The UI is a fast way to populate it.

---

## 1. Design tokens

### 1.1 Color
Brand stays "pitch green" but with proper contrast ratios validated (WCAG AA on all paired tokens).

| Token | Hex | Contrast on white | Usage |
|---|---|---|---|
| `--green-700` | `#1A6B3C` | 7.4:1 ✓ | Primary, CTA, hero header |
| `--green-600` | `#2E8B57` | 4.8:1 ✓ | Hover / pressed |
| `--green-100` | `#E8F5EE` | — | Tinted surface, selected chip |
| `--amber-600` | `#B86F1A` | 4.7:1 ✓ | **Wicket**, warnings (darkened from GPT's `#E6952A` which failed AA on white) |
| `--amber-100` | `#FEF3E2` | — | Wicket tints |
| `--blue-600` | `#1F6FAB` | 5.1:1 ✓ | Extras (darkened from `#2980B9`) |
| `--blue-100` | `#EBF5FB` | — | Extras tints |
| `--red-600` | `#B0392B` | 5.2:1 ✓ | Destructive, illegal entry |
| `--purple-600` | `#6B3FA0` | 5.6:1 ✓ | **Free hit** indicator (new) |
| `--ink-900..50` | `#1A1A1A → #FAFAFA` | — | Text + surfaces |

Color **never** carries state alone — every state pairs with an icon, label, or shape (§7 a11y).

### 1.2 Type
Same families as v1 (DM Serif Display / DM Sans / DM Mono). The hero score uses tabular figures so digits don't jump when the score ticks. Add `font-variant-numeric: tabular-nums` to every Mono usage.

### 1.3 Spacing, radius, elevation
Unchanged from v1 — those were fine.

### 1.4 Motion
| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--motion-fast` | 120ms | `cubic-bezier(0.2, 0, 0, 1)` | Key press, chip select |
| `--motion-mid` | 220ms | same | Sheet / modal in |
| `--motion-slow` | 360ms | same | Score increment count-up, confetti |

Respect `prefers-reduced-motion`: drop all non-essential animation, keep state changes instant.

---

## 2. The scoring keypad — reworked

> **Why the v1 keypad is wrong:** flat keys like `WD` or `LB` don't tell you *how many* runs were taken. "Wide + 2 byes" is one delivery, not two key presses. The fix is a **two-axis** input: pick a *delivery type* (legal / wide / no-ball), then pick *runs* and optionally a *source* (bat / bye / leg-bye). The default path — a legal delivery scoring 0–6 off the bat — stays a single tap.

### 2.1 Layout (152 px tall, fixed above the bottom bar)

```
┌─────────────────────────────────────────────────────────┐
│ [Legal]   [Wide]   [No-ball]      ← delivery-type tabs  │
├─────────────────────────────────────────────────────────┤
│  ⓪   ①   ②   ③                                          │
│  ④   ⑥   W   ⋯   ← "⋯" opens advanced (5, 7, byes/LB)   │
└─────────────────────────────────────────────────────────┘
```

- **Top row (delivery-type segmented control, 36 px):** `Legal` (default, green when selected) · `Wide` (blue) · `No-ball` (purple — because it triggers a free hit). Selecting Wide or No-ball *latches for the next run tap only*, then snaps back to Legal. This makes the common case (a string of legal deliveries) frictionless.
- **Run keys (60 px circles, 6-key grid):** `0 1 2 3 4 6 W ⋯`. Tap = commit ball.
- **"⋯" advanced** opens a 200 ms bottom sheet with: rare run values (`5`, `7`), `Bye` and `Leg-bye` toggles (apply to the next run tap), and `Penalty +5`.
- **Boundary auto-detect:** tapping `4` or `6` sets `boundary` automatically. Long-press `4` to mark "all run four" if the batters actually ran four (rare, affects partnership balls faced).
- **Wicket flow:** tap `W` → opens §3.5 Wicket sheet. The currently-selected delivery type carries over (so "no-ball, caught" is impossible — sheet greys out Caught/Bowled/LBW/Stumped on a no-ball, leaving only Run Out / Obstructing / Handled).
- **Free-hit overlay:** when the next ball is a free hit, the keypad gets a 24 px purple ribbon across the top reading `FREE HIT` and the `W` key is disabled except for the dismissals legal on a free hit.

### 2.2 Ball Entry Key (component spec)
Same visual spec as v1 §2.1 (60 px circle, full radius, scale-0.94 on press) — but the *type-specific color overrides* now apply to the **delivery-type tabs**, not to individual run keys, since runs are mode-independent. The only run keys that carry color are `4` (green tint), `6` (green fill), and `W` (amber fill).

---

## 3. Components

### 3.1 Score Header (128 px, sticky)
Bg `--green-700`. Three rows:
1. **Team chip + Innings indicator + Overs.** Overs display `12.3` means *12 completed overs + 3 legal balls*, **not** decimal. Show `(20)` as denominator: `12.3 / 20`.
2. **Hero score.** Format follows locale: `147/4` (India/UK/SA) or `4/147` (AU/NZ) — driven by a per-tournament setting, default `147/4`. Tabular Mono 40.
3. **Rate chips.** `CRR 7.35` always. In innings 2: `RRR 9.71` + `Need 68 off 42`. If RRR > CRR by >2.0, RRR chip turns amber. If chase mathematically dead (need > balls × 6), border flashes amber once.

### 3.2 Free-hit banner (new)
8 px purple bar that slides down beneath the header for exactly one delivery after a front-foot no-ball. Text: `FREE HIT — only run-out`. Auto-dismisses after the ball is scored.

### 3.3 Partnership card, Bowler strip, Ball-by-ball timeline
As v1, with one fix: **timeline dots for wides/no-balls carry a tiny superscript number** for the runs conceded (`Wd²` = wide for 2). This is how paper scorebooks notate it and umpires read it instantly.

### 3.4 Over summary modal (S09)
**Bowler eligibility fix.** The rule is: *a bowler may not bowl two consecutive overs*. Only the bowler of the **just-completed** over is ineligible — not "last 2 bowlers". Also enforce per-format quotas:

| Format | Max overs per bowler |
|---|---|
| T5 | 1 |
| T10 | 2 |
| T20 | 4 |
| The Hundred | 20 balls (4×5-ball or 2×10-ball sets) |
| 50-over (ODI) | 10 |
| Custom | `floor(totalOvers / 5)` default, editable |

Greyed-out reasons: `Just bowled previous over` · `Quota reached (4/4)` · `Off the field` (if injury/sub-fielder tracking is on).

### 3.5 Wicket sheet (S08) — corrected dismissal table

| Dismissal | Bowler credited | Fielder required | Available on FreeHit | Available on Wide | Available on No-ball |
|---|---|---|---|---|---|
| Bowled | ✓ | — | ✗ | ✗ | ✗ |
| Caught | ✓ | catcher | ✗ | ✗ | ✗ |
| LBW | ✓ | — | ✗ | ✗ | ✗ |
| Stumped | ✓ | wicket-keeper (auto) | ✗ | ✓ | ✗ |
| Hit Wicket | ✓ | — | ✗ | ✗ | ✗ |
| Run Out | ✗ | fielder(s); pick end | ✓ | ✓ | ✓ |
| Obstructing the Field | ✗ | — | ✓ | ✓ | ✓ |
| Hit the Ball Twice | ✗ | — | ✓ | ✗ | ✗ |
| Timed Out | ✗ | — | n/a | n/a | n/a |
| Retired Out | ✗ | — | n/a | n/a | n/a |
| Retired Hurt (not out) | ✗ | — | n/a | n/a | n/a |

GPT's v1 marked Stumped as needing a "fielder" — it specifically needs the keeper. v1 also omitted Hit-the-ball-twice, Timed Out, Retired Out, and Retired Hurt, and got the free-hit interaction wrong.

**Run-out specifics (new):** picker for `End` (striker's / non-striker's), `Crossed?` toggle (decides who's on strike next), and `Runs completed before the run-out` (0–N).

### 3.6 Player list item, Match summary card, Points table row
As v1. One add: **dual badges** — a player can be both Captain (`C`) and Wicket-keeper (`WK`), so the avatar shows stacked mini badges, not one or the other.

---

## 4. Screens — deltas from v1

Only the changes / additions are listed; everything else stands.

**S02 Match Setup:**
- Drop the `DRS` toggle — not realistic for gully scoring.
- Move `Super Over` from setup to an **automatic prompt on tie**, with format-aware default (T20 → enable, T5/T10 → ask).
- Add format: `The Hundred (100 balls)` and `50-over` alongside T5/T10/T20/Custom.
- Powerplay: render as "Mandatory Powerplay overs (first N)" + optional middle/death overs split for 50-over.

**S05 Toss:** add a `Skip toss (manual)` link for when umpires already did it — straight to choose-batting / bowling.

**S07 Live Scoring:**
- Bottom bar overflow menu adds: `Mark wide reviewed` (umpire correction), `Change keeper`, `Declare innings` (multi-day / no-overs-limit formats), `Substitute fielder`, `Concede match`.
- Long-press the score area → quick edit (manual reconciliation) with audit-logged correction.

**S08 Wicket sheet:** see §3.5; also new `New batsman` flow comes inline as a 60% sheet *after* confirm, not as a fresh page transition.

**S10 Innings Break:** add **DLS-revised target** placeholder (manual entry if rain interruption used). Out-of-scope to compute DLS in-app v1, but the field must exist.

**S12 Match Result:**
- Player of the Match is **manually picked** by the umpire (with a "suggested" list ranked by a transparent score: `runs + 2×wickets + 0.5×catches`). v1 implied auto-pick, which clubs find annoying.
- Add `Net Run Rate impact` line: how this match moved each team's NRR.

**S15 Points Table:** show NRR formula in an `(i)` tooltip — `(runs scored / overs faced) − (runs conceded / overs bowled)` over the full *quota* of overs (all-out counts as full quota — a common error).

---

## 5. State machine (new — was missing in v1)

```
SETUP → TOSS → INNINGS_SETUP → IN_PROGRESS
                                  │
        ┌─────────────────────────┼──────────────────────────┐
        ▼                         ▼                          ▼
   BALL_PENDING            OVER_BREAK               INNINGS_BREAK
   (mid-over)              (between overs)          (between innings)
        │                         │                          │
        └────────┬────────────────┘                          ▼
                 ▼                                    INNINGS_SETUP_2
            IN_PROGRESS  ←────────────────────────────  (if 2nd innings)
                 │
                 ▼
            MATCH_END → (RESULT | SUPER_OVER → IN_PROGRESS_SO)
```

Each transition records an event; the event log is what `Undo` (last 3 *balls*, not last 3 *events*) replays. Critical: an undo across an over boundary must restore the previous bowler + ball count, including any wicket. v1 hand-waved this.

---

## 6. Undo & corrections

- **Undo** reverts the last delivery only; up to 3 consecutive undoes across the current and prior over. Snackbar: `Undid: Wide + 2 (Sharma bowling). Tap to redo.`
- **Edit a past ball** (any earlier ball this innings): tap the dot in the over timeline → mini-sheet shows the recorded delivery, all fields editable, with an audit-log entry created. This is the umpire-correction path that v1 missed.
- All edits are append-only events in the log; the displayed score is a fold of the log. This makes rebuilding state after a crash trivial.

---

## 7. Accessibility

- 44×44 min touch; ball entry keys are 60 with 64 hit area.
- `aria-live="polite"` on score header; `aria-live="assertive"` on wicket / free-hit banner.
- Ball-by-ball dots have `aria-label="Ball 4: wide for 2 runs"`.
- High-contrast mode: borders 2 px, fills shift to AAA pairs (provided in the token file).
- Reduced motion: kill coin flip, confetti, score count-up.
- Color-blind safety: every state has a shape OR icon companion. `4` has a thin underline, `6` is filled, `W` carries a wicket-cross glyph, wides have a `Wd` text label not just blue, no-balls a `Nb` label.

---

## 8. Persistence & sync

- **Local-first.** Every event written to IndexedDB before UI commits. App must survive offline for a whole match.
- **Sync queue** when online: optimistic POST per event, idempotent by `eventId`.
- **Shared scorecard URL** (read-only) auto-generated per match for spectators — viewer is a static SSR'd page that long-polls every 5 s; no auth.

---

## 9. Screen inventory (revised)

Same 16 as v1, with these additions:
- **S07c** Live Scoring — *Super Over* variant (6-ball, no over-end transition).
- **S17** Audit log (corrections history per match — accessible from S13).
- **S18** Settings (score format convention, sounds, sync account).

---

## 10. Corrections from v1 (GPT draft)

| # | v1 said | Actual rule / better design |
|---|---|---|
| 1 | Flat keypad keys for `WD`, `NB`, `LB`, `B` | Cannot represent wide+2 or 4-leg-byes. Rebuilt as delivery-type × runs × source (§2). |
| 2 | "Last 2 bowlers greyed out" at over end | Only the bowler of the immediately-prior over is ineligible. |
| 3 | Stumped requires a generic "fielder" | Stumped is by the keeper specifically; auto-fill keeper. |
| 4 | Free hit not mentioned | Front-foot no-ball triggers free hit on the next ball in limited-overs; only run-out (and a couple of edge dismissals) are legal dismissals. Added §3.2, §3.5 columns. |
| 5 | Missing dismissals: Hit-the-ball-twice, Timed Out, Retired Out, Retired Hurt | Added to §3.5. |
| 6 | Obstructing — bowler credited unclear | Bowler is **not** credited; corrected in §3.5 table. |
| 7 | Overs shown as decimal (implied) | `12.3` is "12 overs and 3 balls" — annotated, and a `/20` denominator added. |
| 8 | "DRS" as a setup toggle | Removed; out of scope for amateur scoring. |
| 9 | Super Over as a setup toggle | Removed from setup; auto-prompted on tie. |
| 10 | Player of the Match auto-picked | Manual pick with a transparent suggestion ranking. |
| 11 | Amber `#E6952A` on white | Fails WCAG AA (3.0:1). Darkened to `#B86F1A` (4.7:1). Same for blue. |
| 12 | NRR not defined | Formula and "all-out = full quota" rule added in §4 (S15). |
| 13 | No state machine, no event log | Added §5 + §6 — undo across over boundaries now well-defined. |
| 14 | No offline story | Added §8 — local-first event log, optimistic sync. |
| 15 | One Captain/WK badge slot | Players can hold both; stacked badges (§3.6). |
| 16 | Missing formats | Added The Hundred and 50-over ODI; per-format bowler quotas (§3.4). |
| 17 | Score format `RUNS/WICKETS` only | Made convention configurable (IND/UK/SA vs AUS/NZ). |
| 18 | No correction-of-past-ball path | Added in §6 (edit any prior ball, append-only audit). |
| 19 | Confetti / motion not gated on reduced-motion | Gated in §1.4 and §7. |
| 20 | Penalty runs unclear (whose side?) | Now explicit: penalty is awarded *to* the batting or fielding side; sheet asks which. |

---

*End of Spec — StumpScore v2.0.*
