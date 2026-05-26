# Cricket Scorer — Design Specification
**App name:** StumpScore  
**Version:** 1.0  
**Target:** Gully & Club cricket — umpire-operated mobile scorer  
**Platform:** Mobile-first (iOS + Android). Primary viewport: 390 × 844 px.

---

## 1. Design Tokens

### 1.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--pitch-green` | `#1A6B3C` | Primary brand, CTA buttons, active states |
| `--pitch-green-light` | `#E8F5EE` | Tinted backgrounds, selected states |
| `--pitch-green-mid` | `#2E8B57` | Hover, pressed states |
| `--amber-accent` | `#E6952A` | Wicket alerts, warnings, boundary highlights |
| `--amber-light` | `#FEF3E2` | Wicket / alert backgrounds |
| `--red-danger` | `#C0392B` | Errors, invalid entries |
| `--sky-blue` | `#2980B9` | Extra runs (wides, no-balls, byes) |
| `--sky-blue-light` | `#EBF5FB` | Extra run tinted backgrounds |
| `--neutral-900` | `#1A1A1A` | Primary text |
| `--neutral-700` | `#4A4A4A` | Secondary text, labels |
| `--neutral-400` | `#9E9E9E` | Placeholder, disabled |
| `--neutral-200` | `#E0E0E0` | Dividers, borders |
| `--neutral-100` | `#F5F5F5` | Page background |
| `--neutral-50` | `#FAFAFA` | Card background |
| `--white` | `#FFFFFF` | Surfaces |

### 1.2 Typography

| Token | Font | Size | Weight | Line-height | Usage |
|---|---|---|---|---|---|
| `--type-display` | `DM Serif Display` | 32px | 400 | 1.15 | Match result headline |
| `--type-h1` | `DM Sans` | 24px | 700 | 1.25 | Screen titles, score main |
| `--type-h2` | `DM Sans` | 20px | 600 | 1.3 | Section headers, team name |
| `--type-h3` | `DM Sans` | 17px | 600 | 1.4 | Card titles, player names |
| `--type-body` | `DM Sans` | 15px | 400 | 1.6 | General text |
| `--type-label` | `DM Sans` | 13px | 500 | 1.4 | Labels, metadata, over text |
| `--type-caption` | `DM Sans` | 11px | 400 | 1.4 | Ball-by-ball sequence, footnotes |
| `--type-mono-score` | `DM Mono` | 40px | 700 | 1.0 | Live run total (hero score) |
| `--type-mono-sm` | `DM Mono` | 16px | 600 | 1.2 | RRR, CRR, over count |

### 1.3 Spacing Scale (8px base grid)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 px`

### 1.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Chips, badges |
| `--radius-md` | `12px` | Cards, input fields |
| `--radius-lg` | `16px` | Bottom sheets, modals |
| `--radius-xl` | `24px` | FAB, pill buttons |
| `--radius-full` | `999px` | Ball entry keys, avatar |

### 1.5 Elevation / Shadow

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.10)` | Cards |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.12)` | Modal, bottom sheet |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.15)` | FAB, action sheet |

---

## 2. Component Library

### 2.1 Ball Entry Key
A circular tap target for the umpire to record each delivery.

**Variants:** `type = [0, 1, 2, 3, 4, 6, W, WD, NB, LB, B, Pen]`

| Property | Spec |
|---|---|
| Size | 60 × 60 px (touch target 64 × 64 px) |
| Shape | `border-radius: --radius-full` |
| Default bg | `--white`, border `1.5px solid --neutral-200` |
| Default text | `--type-h2`, color `--neutral-900` |
| Pressed state | Scale `0.94`, bg `--neutral-100` |

**Color overrides by type:**
- `4` → bg `--pitch-green-light`, text `--pitch-green`, border `--pitch-green`
- `6` → bg `--pitch-green`, text `--white` (filled, no border)
- `W` → bg `--amber-accent`, text `--white`
- `WD` / `NB` → bg `--sky-blue-light`, text `--sky-blue`, border `--sky-blue`
- `LB` / `B` → bg `--neutral-100`, text `--neutral-700`, border dashed
- `Pen` → bg `--red-danger`, text `--white`

**Layout:** 6 keys per row × 2 rows. Gap `8px`. Row 1: `0 1 2 3 4 6`. Row 2: `W WD NB LB B Pen`.

---

### 2.2 Score Header
Fixed top bar on the Live Scoring screen. Shows match state at a glance.

**Height:** 128px (with safe-area inset top)  
**Background:** `--pitch-green`  
**Content (top to bottom):**
1. Row: Team name (left, `--type-h3` white) + Overs (right, `--type-label` white/70%)
2. Hero score: `RUNS/WICKETS` in `--type-mono-score` white. e.g. `147/4`
3. Row: CRR chip (left) + Required / Target chip (right)

**CRR chip:** `--white/15%` bg pill, `--type-mono-sm`, white text. Label `CRR` then value.  
**Target chip:** Same style. Shows `Need 68 off 42` in 2nd innings.

---

### 2.3 Current Partnership Card
White card below Score Header.

**Height:** 72px  
**Padding:** `12px 16px`  
**Content:**
- Left: Striker name + `*` (bold), runs (score), balls faced. `--type-h3` / `--type-label`
- Divider: `1px solid --neutral-200` vertical
- Right: Non-striker name, runs, balls faced
- Bottom row (below divider): `Partnership: 34 (28)` — `--type-label --neutral-700`

**Strike indicator:** Small `--pitch-green` filled circle (`8px`) before striker name.

---

### 2.4 Current Bowler Strip
Thin strip below Partnership Card.

**Height:** 44px  
**Background:** `--neutral-100`  
**Content:** Bowling icon (cricket ball SVG, 16px, `--neutral-700`) + Bowler name + figures e.g. `3-0-22-1` + overs in current spell.

---

### 2.5 Ball-by-Ball Timeline
Horizontal scrollable row of ball dots for the current over.

**Container height:** 48px  
**Ball dot size:** 32px circle  
**States:**
- `dot-default` → outline circle, neutral-300 border
- `dot-0` → `--neutral-200` bg, label "·" (dot)
- `dot-runs(1-3)` → white bg, `--neutral-900` number
- `dot-4` → `--pitch-green-light` bg, `--pitch-green` text **4**
- `dot-6` → `--pitch-green` bg, white **6**
- `dot-W` → `--amber-accent` bg, white **W**
- `dot-WD` / `dot-NB` → `--sky-blue-light` bg, `--sky-blue` text
- `dot-LB` / `dot-B` → `--neutral-100` bg, dashed border

**Current ball position:** Outlined `--pitch-green` circle (empty) at next position.  
**Over label:** `Over 7` in `--type-label --neutral-400` at left. `(+3 extras)` appended if extras exist.

---

### 2.6 Wicket Entry Bottom Sheet
Slides up when `W` is tapped.

**Height:** Dynamic (max 70% screen height)  
**Border radius top:** `--radius-lg`  
**Handle bar:** `4 × 40px`, `--neutral-300`, centered, `8px` from top

**Sections:**
1. **"Who's out?"** — Scrollable list of active batsmen (chips). Selected = `--pitch-green` filled chip.
2. **"How?"** — Horizontal scroll of dismissal type chips:
   `Bowled / Caught / LBW / Run Out / Stumped / Hit Wicket / Obstructing`
3. **Fielder** (appears for Caught, Run Out, Stumped) — Player picker from fielding team roster.
4. **Confirm button** — Full-width `--pitch-green` filled button "Confirm Wicket".

---

### 2.7 Over Complete Modal
Appears after 6th legal delivery.

**Style:** Center modal, `--shadow-md`, `--radius-lg`  
**Width:** `min(340px, 90vw)`  
**Content:**
- Over summary: `Over 7 complete — 8 runs (1W, 1WD)` 
- Mini ball timeline (read-only, same dot spec)
- "Select next bowler" heading with player grid (same team, last 2 bowlers greyed out per over rules)
- "Confirm" CTA

---

### 2.8 Team Name Chip
Reusable pill for team identification.

**Height:** 28px, padding `4px 12px`, `--radius-sm`  
**Batting team:** `--pitch-green` bg, white text  
**Fielding team:** `--neutral-100` bg, `--neutral-700` text

---

### 2.9 Player List Item
Used in roster setup and picker dropdowns.

**Height:** 52px, padding `12px 16px`  
**Left:** Avatar circle (32px, initials, `--pitch-green-light` bg, `--pitch-green` text) + Name + optional jersey number  
**Right:** Role badge (Bat / Bowl / All / WK) — small colored chip  
**States:** default / selected (green check + bg tint) / captain (C badge on avatar)

---

### 2.10 Points Table Row
Tournament standings component.

**Columns:** Pos | Team | P | W | L | NR | NRR | Pts  
**Header row:** `--neutral-100` bg, `--type-label --neutral-700`  
**Body row height:** 48px  
**Qualified indicator:** `--pitch-green` left border (2px) on top-N rows  
**Eliminated indicator:** `--neutral-400` text, `--neutral-100` bg

---

## 3. Screen Inventory

| # | Screen | Role | Trigger |
|---|---|---|---|
| S01 | Home / Dashboard | All | App launch |
| S02 | Match Setup | Umpire | "New Match" tap |
| S03 | Team Roster — Team A | Umpire | After match setup |
| S04 | Team Roster — Team B | Umpire | After Team A |
| S05 | Toss | Umpire | After rosters |
| S06 | Innings Setup | Umpire | After toss |
| S07 | Live Scoring | Umpire | After setup |
| S08 | Wicket Entry Sheet | Umpire | W tapped on S07 |
| S09 | Over Complete Modal | Auto | 6th legal ball |
| S10 | Innings Break | Auto | Last wicket / last over |
| S11 | Target Chase Setup | Umpire | 2nd innings start |
| S12 | Match Result | Auto | Match ends |
| S13 | Scorecard | All | Tab on S07 / S12 |
| S14 | Tournament Setup | Umpire | "New Tournament" tap |
| S15 | Points Table | All | Tournament screen |
| S16 | Match Schedule | All | Tournament detail |

---

## 4. Screen Specifications

---

### S01 — Home / Dashboard

**Status bar:** System default  
**Nav bar:** None (full-screen)

**Layout (top → bottom):**

1. **App header** (64px)  
   - Logo mark (stumps icon, `--pitch-green`) + wordmark "StumpScore" (`--type-h2`)  
   - Right: Settings icon (24px, `--neutral-700`)

2. **Active matches section** (if any)  
   - Section label: `Active matches` (`--type-label --neutral-400`, uppercase)  
   - Cards: `MatchSummaryCard` component (see below), scrollable horizontal  

3. **Quick actions grid** (2 × 2)  
   - "New Match" — `--pitch-green` filled card, stumps icon  
   - "New Tournament" — outlined card, trophy icon  
   - "Recent Scorecards" — outlined card, list icon  
   - "My Teams" — outlined card, people icon  
   - Card size: `(screen-width/2 - 24) × 100px`, `--radius-md`

4. **Recent completed matches** — vertical list of `MatchSummaryCard` (compact)

**MatchSummaryCard:**  
- White card, `--shadow-sm`, `--radius-md`, padding `12px 16px`  
- Team A name + score + Team B name + score (2-col layout)  
- Result string: "Team A won by 23 runs" (`--type-label --pitch-green`)  
- Match type badge + date chip (right-aligned, `--neutral-400`)

---

### S02 — Match Setup

**Nav:** Back arrow + "Match Setup" title (centered) + "Next" text button (`--pitch-green`)

**Form sections:**

1. **Match format** — Segmented control:  
   `T5 | T10 | T20 | Custom`  
   Selected: `--pitch-green` bg, white text. Unselected: `--neutral-100`.  
   If "Custom" → integer input field for overs appears below.

2. **Teams**  
   - "Team A Name" — text input  
   - "Team B Name" — text input  
   - "Load existing team" link below each (opens team picker sheet)

3. **Match options** (toggles)  
   - Super Over enabled  
   - Powerplay overs (enter count)  
   - Penalty runs allowed  
   - DRS (Decision Review) — toggle

4. **Tournament link** (optional)  
   - "Add to tournament" — dropdown picker (or "None")

**Bottom CTA:** Full-width filled button "Set Up Teams →"

---

### S03 & S04 — Team Roster

**Nav:** Team name as title (e.g., "Challengers XI") + "Done" button

**Subheader row:**  
- Player count chip: `9 / 11 players` (amber if under 11)  
- Captain indicator reminder

**Player list:**  
- Each row: `PlayerListItem` component  
- Add button at bottom of list: dashed border card "+ Add Player"  
- Drag handle on right for reordering (batting order)

**Long-press player row** → context menu: "Set as Captain / Set as Wicket-keeper / Remove"

**Footer:** "Save & Continue →" CTA

---

### S05 — Toss

**Layout:** Centered, vertically stacked

1. **Coin animation area** (160 × 160px circle, `--pitch-green-light` bg)  
   - Large coin SVG, animated flip on "Flip" button tap  
   - Result: "HEADS" or "TAILS" in `--type-display`

2. **"[Team name] won the toss"** — `--type-h2`

3. **"Choose to:"** — two large option cards side by side  
   - "BAT" (bat icon + label)  
   - "BOWL" (ball icon + label)  
   - Selected: `--pitch-green` border + bg tint  

4. **Confirm CTA** — "Start Match →"

---

### S06 — Innings Setup

**Nav:** "Innings 1 Setup"

**Sections:**

1. **Opening batsmen** — "Select 2 openers"  
   - Player picker, multi-select exactly 2  
   - Striker designation toggle (radio between the two)

2. **Opening bowler** — "Select opening bowler"  
   - Single player picker from fielding team

3. **Summary card** (read-only confirm view):  
   - "[Team A] will bat first"  
   - Striker: Player name | Non-striker: Player name  
   - Opening bowler: Player name

**CTA:** "Start Innings →"

---

### S07 — Live Scoring *(Primary Screen)*

**Fixed top:** `Score Header` component (128px)  
**Below header (scroll container, but typically fits without scroll):**

- `Current Partnership Card` (72px)
- `Current Bowler Strip` (44px)
- `Ball-by-Ball Timeline` (48px) — current over
- `Ball Entry Keypad` (152px) — 2 rows × 6 keys

**Bottom action bar (fixed, 56px):**  
- Left: "Undo" icon button (counter-clockwise arrow)  
- Center: "Scorecard" text button → navigates to S13  
- Right: "⋮" overflow → options: Retire batsman / Change bowler mid-over / Penalty runs / End innings manually

**Key interactions:**
- Tap a ball key → score recorded, timeline updates, partnership updates
- Tap `W` → S08 Wicket Sheet slides up
- After 6th legal delivery → S09 Over Complete Modal appears
- After all wickets or all overs → S10 Innings Break

**2nd innings behavior:**  
- Score header shows target: `Need 68 off 42 balls`  
- Header bg stays `--pitch-green` but adds `Target: 215` chip in header row 1
- If winning situation: header bg changes to `--pitch-green-mid`
- If losing (cannot win): header area border changes to `--amber-accent`

---

### S08 — Wicket Entry (Bottom Sheet)

*See Component 2.6 spec above.*

**Dismissal type → required fields:**

| Dismissal | Bowler credited? | Fielder needed? |
|---|---|---|
| Bowled | Yes | No |
| Caught | Yes | Yes (catcher) |
| LBW | Yes | No |
| Run Out | No | Yes (fielder) |
| Stumped | Yes | Yes (keeper auto-selected) |
| Hit Wicket | Yes | No |
| Obstructing | No | No |

After confirming wicket → S07 continues with "Select new batsman" prompt (inline list overlay).

---

### S09 — Over Complete Modal

*See Component 2.7 spec above.*

**Bowler selection rules:**  
- Cannot bowl 2 consecutive overs → grey out + tooltip "Can't bowl consecutive overs"  
- Max overs quota reached → grey out + "Quota full"  
- Default highlight: last bowler who bowled → make ineligible visually clear

---

### S10 — Innings Break

**Full screen.**  
**Background:** `--pitch-green` gradient top 40%, then `--white`

**Content:**
1. "End of Innings 1" — `--type-label` white  
2. Team A score in `--type-mono-score` white (e.g. `187 / 8`)  
3. Over count: `(20.0 overs)` — white/70%  
4. **Target set card** (white, `--radius-lg`, centered):  
   - "Target" label  
   - `188` in `--type-display --pitch-green`  
   - "[Team B] need 188 to win"  
5. **Mini scorecard tabs**: `Batting` | `Bowling` — key stats preview  
6. **CTA:** "Start Innings 2 →" full-width

---

### S11 — Target Chase Setup

**Same as S06** with "Innings 2 Setup" title.  
Shows target banner at top: `Chasing 188 in 20 overs`

---

### S12 — Match Result

**Full screen. Celebratory layout.**

1. **Trophy/Stumps illustration** (top 35%, `--pitch-green-light` bg area)  
   - Winner team name in large type  
   - Confetti particle animation (CSS keyframes)

2. **Result card** (white, `--radius-lg`):  
   - Result string: "[Team A] won by 34 runs" — `--type-display --neutral-900`  
   - Player of the match: avatar + name + `50(32), 2/18`  
   - Match summary: both teams scores, overs, date/venue

3. **Action bar (3 buttons):**  
   - "View Full Scorecard" — outlined  
   - "Share Result" — outlined + share icon  
   - "New Match" — `--pitch-green` filled

---

### S13 — Scorecard

**Nav:** Match subtitle (Team A vs Team B) + close/back button  
**Tab bar (sticky):** `Batting` | `Bowling` | `Fall of Wickets` | `Extras`

**Batting tab table columns:**  
`Batsman | R | B | 4s | 6s | SR`  
- Header: `--neutral-100` bg, `--type-label`  
- Row height: 48px  
- DNB players shown in lighter gray italic  
- Extras row at bottom (highlighted): `Extras: W-3, NB-2, B-1, LB-0 = 6`  
- Total row: bold, `--pitch-green` text for score

**Bowling tab table columns:**  
`Bowler | O | M | R | W | Econ | WD | NB`

**Fall of Wickets tab:**  
Timeline-style list: `1st — 23/1 (4.2)` format, one per line, `--type-body`

**Extras tab:**  
Card layout showing wides / no-balls / byes / leg-byes / penalties with totals.

---

### S14 — Tournament Setup

**Nav:** "Tournament Setup"

**Form:**
1. Tournament name — text input
2. Format — segmented: `League | Knockout | League + Knockout`
3. Match format — same as S02
4. Teams — add teams (name chips with × to remove), min 2
5. Venue — text input (optional)
6. Start date — date picker

**CTA:** "Create Tournament →"

---

### S15 — Points Table

**Nav:** Tournament name + "Points Table" subtitle

**Table:**  
Full-width, columns as defined in Component 2.10.  
`NRR` shown with `+` or `-` prefix, colored (`--pitch-green` for positive, `--red-danger` for negative).

**Legend:** Green left-border = qualify, amber = playoff spot, no border = eliminated.

**Below table:**  
"[N] matches remaining" chip.

---

### S16 — Match Schedule

**Nav:** Tournament name + "Schedule"

**Filter chips (horizontal scroll):** `All | Round 1 | Round 2 | Upcoming | Completed`

**Match cards (vertical list):**  
Each: Team A vs Team B, date + time, venue, result/status chip.  
Status chip variants: `Upcoming (--sky-blue)` | `Live (--amber, pulsing dot)` | `Completed (--neutral-400)` | `No Result (--neutral-300)`

**Tap match card** → navigates to S07 (if live) or S12/S13 (if completed).

---

## 5. User Flows

### 5.1 Quick Match Flow
`S01 → S02 → S03 → S04 → S05 → S06 → S07 → [S08 on wicket] → [S09 on over end] → S10 → S11 → S07 → S12`

### 5.2 Tournament Flow
`S01 → S14 → S15 → S16 → (pick match) → S02 → ... (same as Quick Match)`

### 5.3 Undo Last Ball
`S07: tap Undo → confirmation snackbar ("Undo last ball: 4 runs") with 5s auto-dismiss → score reverts`  
Undo is limited to last 3 balls in current over.

### 5.4 Retire Batsman
`S07 → ⋮ menu → "Retire batsman" → select batsman → select new batsman → continue`

### 5.5 Share Scorecard
`S12 → "Share Result" → system share sheet with scorecard image (auto-generated from S13 view)`

---

## 6. Accessibility Notes

- All interactive elements: min touch target 44 × 44px
- Color alone never conveys state — always paired with icon or label
- Ball entry keys have `aria-label` e.g. `aria-label="No-ball"`
- Screen reader: Score header region announced on update: `"Mumbai Strikers 147 for 4, CRR 7.35"`
- Undo snackbar: `role="status"` live region
- High-contrast mode: borders strengthen to 2px, text sizes +1 step

---

## 7. Things Added Beyond Your Request

| Feature | Rationale |
|---|---|
| **Extras (WD, NB, LB, B)** | Mandatory for any proper scorebook; wides & no-balls don't count as legal deliveries |
| **Toss screen** | Standard pre-match formality in all cricket formats |
| **Striker designation** | Needed to track who faces each ball |
| **Undo (last 3 balls)** | Umpires mis-tap; essential for trust in the tool |
| **CRR / RRR** | Standard live metric; helps umpire announce mid-over |
| **Partnership tracking** | Contextual — tells the story of the innings |
| **Fall of wickets log** | Scorecard standard; needed for match records |
| **Bowler quota enforcement** | Prevents illegal bowling automatically |
| **Consecutive over prevention** | ICC/local rules enforcement built in |
| **Player of the Match** | Common in club cricket; adds ceremony to result |
| **Tournament points table** | Gully cricket often runs league formats |
| **NRR calculation** | Tiebreaker in league tables; auto-computed |
| **Penalty runs** | Applicable in club matches (code of conduct infractions) |
| **Super Over toggle** | Common in T20 knockout finals |
| **Scorecard sharing** | Clubs share scorecards on WhatsApp groups |
| **Retire batsman** | Occurs in gully cricket; must be handled gracefully |
| **DNB (Did Not Bat)** | Scorecard completeness |

---

## 8. Figma File Structure (Recommended)

```
StumpScore (Figma File)
├── 🎨 Design System
│   ├── Colors (all --tokens as Figma variables)
│   ├── Typography (text styles)
│   ├── Spacing (grids + spacing tokens)
│   └── Elevation (effect styles)
│
├── 🧩 Components
│   ├── Ball Entry Key (variants: 0,1,2,3,4,6,W,WD,NB,LB,B,Pen)
│   ├── Score Header
│   ├── Partnership Card
│   ├── Bowler Strip
│   ├── Ball Dot (variants: 0–6, W, WD, NB, LB, B, empty)
│   ├── Ball Timeline (auto-layout, horizontal)
│   ├── Player List Item (states: default, selected, captain)
│   ├── Match Summary Card (compact + full)
│   ├── Points Table Row
│   ├── Team Name Chip
│   └── Status Badge (upcoming, live, completed, no result)
│
├── 📱 Screens
│   ├── S01 Home
│   ├── S02 Match Setup
│   ├── S03–S04 Team Roster
│   ├── S05 Toss
│   ├── S06 Innings Setup
│   ├── S07 Live Scoring (1st innings)
│   ├── S07b Live Scoring (2nd innings / chase)
│   ├── S08 Wicket Sheet (overlay)
│   ├── S09 Over Complete (modal)
│   ├── S10 Innings Break
│   ├── S12 Match Result
│   ├── S13 Scorecard – Batting
│   ├── S13 Scorecard – Bowling
│   ├── S14 Tournament Setup
│   ├── S15 Points Table
│   └── S16 Match Schedule
│
└── 🔄 Prototyping Flows
    ├── Flow 1: Quick Match
    └── Flow 2: Tournament Match
```

---

*End of Spec — StumpScore v1.0*