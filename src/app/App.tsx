import { useEffect } from "react";
import { Home as HomeIcon, Activity } from "lucide-react";
import { Home } from "./components/cricket/Home";
import { LiveScoring } from "./components/cricket/LiveScoring";
import { Scorecard } from "./components/cricket/Scorecard";
import { MatchResult } from "./components/cricket/MatchResult";
import { MatchSetupScreen } from "./components/cricket/MatchSetupScreen";
import { RosterScreen } from "./components/cricket/RosterScreen";
import { TossScreen } from "./components/cricket/TossScreen";
import { InningsSetupScreen } from "./components/cricket/InningsSetupScreen";
import { InningsBreakScreen } from "./components/cricket/InningsBreakScreen";
import { SettingsScreen } from "./components/cricket/SettingsScreen";
import { HelpScreen } from "./components/cricket/HelpScreen";
import { NavProvider, useNav } from "./components/cricket/nav";
import { MatchProvider, useMatch } from "../hooks/useMatch";
import { Toaster } from "./components/ui/sonner";

function Screen() {
  const { route } = useNav();
  switch (route.name) {
    case "home": return <Home />;
    case "match_setup": return <MatchSetupScreen />;
    case "roster": return <RosterScreen teamIndex={route.teamIndex} />;
    case "toss": return <TossScreen />;
    case "innings_setup": return <InningsSetupScreen />;
    case "live": return <LiveScoring />;
    case "innings_break": return <InningsBreakScreen />;
    case "result": return <MatchResult />;
    case "scorecard": return <Scorecard />;
    case "settings": return <SettingsScreen />;
    case "help": return <HelpScreen />;
    default: return <Home />;
  }
}

function TabBar() {
  const { route, go } = useNav();
  const { derivedState } = useMatch();
  
  const hasActiveMatch = derivedState && derivedState.match && derivedState.match.state !== 'RESULT';

  const tabs = [
    { key: "home", label: "Home", icon: HomeIcon, route: { name: "home" as const } },
    ...(hasActiveMatch ? [{ key: "live", label: "Scoring", icon: Activity, route: { name: "live" as const } }] : []),
  ];
  return (
    <div className="h-[64px] bg-card border-t border-border flex items-stretch px-1 select-none shrink-0 transition-colors duration-200">
      {tabs.map((t) => {
        const active = route.name === t.key;
        return (
          <button
            key={t.key}
            onClick={() => go(t.route)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 active:opacity-60 cursor-pointer ${
              active ? "text-pitch-700" : "text-ink-400"
            }`}
          >
            <t.icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-semibold">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Shell() {
  const { route } = useNav();
  const { derivedState } = useMatch();
  
  const hasActiveMatch = derivedState && derivedState.match && derivedState.match.state !== 'RESULT';

  // Only show the tab bar if we have an active match AND we aren't inside setup/action flows
  const showTabs = hasActiveMatch && ![
    "match_setup",
    "roster",
    "toss",
    "innings_setup",
    "live",
    "innings_break",
    "result",
    "scorecard",
    "settings",
    "help"
  ].includes(route.name);

  return (
    <div
      className="mx-auto bg-background text-foreground flex flex-col overflow-hidden border-x border-border shadow-2xl transition-colors duration-200"
      style={{
        width: "min(100vw, 430px)",
        height: "100dvh",
        maxHeight: "100dvh",
        fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* C10: Added screen transitions by keying the container with route.name */}
      <div key={route.name} className="flex-1 min-h-0 flex flex-col animate-fade-in">
        <Screen />
      </div>
      {showTabs && <TabBar />}
    </div>
  );
}

export default function App() {
  // C18: Sync and apply selected Theme configuration (system preference / user override)
  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      const currentTheme = localStorage.getItem('runbook_theme') || 'system';
      if (
        currentTheme === 'dark' || 
        (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if ((localStorage.getItem('runbook_theme') || 'system') === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return (
    <MatchProvider>
      <NavProvider>
        <Shell />
        <Toaster closeButton position="top-center" />
      </NavProvider>
    </MatchProvider>
  );
}
