import { createContext, useContext, useState, type ReactNode } from "react";

export type Route =
  | { name: "home" }
  | { name: "match_setup" }
  | { name: "roster"; teamIndex: 0 | 1 }
  | { name: "toss" }
  | { name: "innings_setup" }
  | { name: "live" }
  | { name: "innings_break" }
  | { name: "result" }
  | { name: "scorecard" }
  | { name: "settings" }
  | { name: "tournament" }
  | { name: "help" };

type Ctx = {
  route: Route;
  go: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
  canBack: boolean;
};

const NavCtx = createContext<Ctx | null>(null);

const MAX_STACK_SIZE = 20;

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }]);
  const route = stack[stack.length - 1];

  const go = (r: Route) => setStack((s) => {
    const nextStack = [...s, r];
    // Keep stack restricted to prevent unbounded memory growth
    if (nextStack.length > MAX_STACK_SIZE) {
      return nextStack.slice(nextStack.length - MAX_STACK_SIZE);
    }
    return nextStack;
  });

  const replace = (r: Route) => setStack((s) => {
    if (s.length === 0) return [r];
    return [...s.slice(0, -1), r];
  });

  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  return (
    <NavCtx.Provider value={{ route, go, replace, back, canBack: stack.length > 1 }}>
      {children}
    </NavCtx.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error("NavProvider missing");
  return ctx;
}
