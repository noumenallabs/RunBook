export type Dot =
  | { kind: "run"; runs: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; boundary?: "four" | "six" }
  | { kind: "wide"; runs: number }
  | { kind: "no_ball"; runs: number }
  | { kind: "bye"; runs: number }
  | { kind: "leg_bye"; runs: number }
  | { kind: "wicket"; how: string };

export const currentOver: Dot[] = [
  { kind: "run", runs: 1 },
  { kind: "run", runs: 4, boundary: "four" },
  { kind: "wide", runs: 1 },
  { kind: "run", runs: 0 },
  { kind: "leg_bye", runs: 2 },
];

export const batting = [
  { name: "R. Sharma", out: "c Patel b Khan", r: 42, b: 31, fours: 5, sixes: 1, sr: 135.4 },
  { name: "V. Kohli *", out: "not out",        r: 58, b: 39, fours: 6, sixes: 2, sr: 148.7 },
  { name: "S. Iyer",   out: "lbw b Bumrah",    r: 12, b: 14, fours: 1, sixes: 0, sr: 85.7 },
  { name: "H. Pandya *",out: "not out",        r: 23, b: 11, fours: 2, sixes: 1, sr: 209.1 },
];

export const bowling = [
  { name: "J. Bumrah", o: "4.0", m: 0, r: 28, w: 2, econ: 7.0, wd: 1, nb: 0 },
  { name: "M. Shami",  o: "4.0", m: 1, r: 22, w: 1, econ: 5.5, wd: 0, nb: 1 },
  { name: "Y. Chahal", o: "3.3", m: 0, r: 34, w: 0, econ: 9.7, wd: 2, nb: 0 },
  { name: "R. Jadeja", o: "4.0", m: 0, r: 31, w: 1, econ: 7.8, wd: 0, nb: 0 },
];

export const fow = [
  { wkt: 1, score: "23/1",  over: "4.2",  batter: "Gill" },
  { wkt: 2, score: "78/2",  over: "9.4",  batter: "Sharma" },
  { wkt: 3, score: "92/3",  over: "11.1", batter: "Iyer" },
  { wkt: 4, score: "141/4", over: "16.3", batter: "Rahul" },
];

export const table = [
  { pos: 1, team: "Mumbai Strikers",   p: 8, w: 6, l: 2, nr: 0, nrr: +1.21, pts: 12, status: "Q" },
  { pos: 2, team: "Chennai Chargers",  p: 8, w: 5, l: 2, nr: 1, nrr: +0.84, pts: 11, status: "Q" },
  { pos: 3, team: "Delhi Daredevils",  p: 8, w: 5, l: 3, nr: 0, nrr: +0.12, pts: 10, status: "P" },
  { pos: 4, team: "Bengaluru Royals",  p: 8, w: 4, l: 4, nr: 0, nrr: -0.05, pts:  8, status: "P" },
  { pos: 5, team: "Kolkata Knights",   p: 8, w: 3, l: 5, nr: 0, nrr: -0.34, pts:  6, status: "E" },
  { pos: 6, team: "Punjab Panthers",   p: 8, w: 1, l: 7, nr: 0, nrr: -1.62, pts:  2, status: "E" },
];
