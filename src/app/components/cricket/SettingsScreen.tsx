import React, { useState } from 'react';
import { useNav } from './nav';
import { useMatch } from '../../../hooks/useMatch';
import { Info, HelpCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsScreen: React.FC = () => {
  const nav = useNav();
  const { derivedState, startNewMatch } = useMatch();

  const [scoreConvention, setScoreConvention] = useState<'runs_wickets' | 'wickets_runs'>(
    derivedState?.match.scoreConvention || 'runs_wickets'
  );
  
  const [haptics, setHaptics] = useState<boolean>(() => {
    return localStorage.getItem('runbook_haptics') !== 'false';
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('runbook_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const handleSave = async () => {
    // 1. Save device preferences to local storage
    localStorage.setItem('runbook_haptics', haptics ? 'true' : 'false');
    localStorage.setItem('runbook_theme', theme);

    // Apply the theme immediately
    const root = window.document.documentElement;
    if (
      theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. If a match is active, update its scoring layout convention in IndexedDB
    if (derivedState) {
      const updatedMatch = {
        ...derivedState.match,
        scoreConvention,
      };
      await startNewMatch(updatedMatch);
    }

    toast.success('App preferences saved successfully.');
    nav.back();
  };

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center justify-between shrink-0">
        <button
          onClick={() => nav.back()}
          className="text-sm font-semibold text-ink-700 hover:text-ink-900 cursor-pointer"
        >
          Cancel
        </button>
        <span className="text-base font-bold text-ink-900">App Settings</span>
        <button
          onClick={handleSave}
          className="text-sm font-bold text-pitch-700 hover:text-pitch-600 cursor-pointer"
        >
          Save
        </button>
      </div>

      {/* Main Settings Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scoring Options */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-4">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block border-b border-ink-100 pb-1.5">
            Scoring Preferences
          </span>

          {/* Convention toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink-900 block">Score Format Convention</span>
              <span className="text-[10px] text-ink-400 font-medium block">runs/wickets (IND) vs wickets/runs (AUS)</span>
            </div>
            <div className="flex border border-ink-200 rounded-lg overflow-hidden font-mono text-xs font-bold shrink-0">
              <button
                onClick={() => setScoreConvention('runs_wickets')}
                className={`px-3 py-1.5 cursor-pointer ${
                  scoreConvention === 'runs_wickets' ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                147/4
              </button>
              <button
                onClick={() => setScoreConvention('wickets_runs')}
                className={`px-3 py-1.5 cursor-pointer ${
                  scoreConvention === 'wickets_runs' ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                4/147
              </button>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-4">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block border-b border-ink-100 pb-1.5">
            Device Integration
          </span>

          {/* Haptics toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink-900 block">Haptic Feedback</span>
              <span className="text-[10px] text-ink-400 font-medium block">Vibrate briefly on runs/wickets key taps</span>
            </div>
            <button
              onClick={() => setHaptics(!haptics)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                haptics ? 'bg-pitch-700 flex justify-end' : 'bg-ink-200 flex justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-md"></span>
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block border-b border-ink-100 pb-1.5">
            Display Appearance
          </span>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-ink-900 block">Color Theme</span>
              <span className="text-[10px] text-ink-400 font-medium block">Customize how RunBook looks</span>
            </div>
            <div className="flex border border-ink-200 rounded-lg overflow-hidden font-mono text-xs font-bold shrink-0">
              <button
                onClick={() => setTheme('light')}
                className={`px-2 py-1.5 cursor-pointer ${
                  theme === 'light' ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                LIGHT
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-2 py-1.5 cursor-pointer ${
                  theme === 'dark' ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                DARK
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`px-2 py-1.5 cursor-pointer ${
                  theme === 'system' ? 'bg-pitch-700 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                SYSTEM
              </button>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div 
          onClick={() => nav.go({ name: 'help' })}
          className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-3 cursor-pointer hover:bg-ink-100/50 active:scale-98 transition-all"
        >
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block border-b border-ink-100 pb-1.5">
            Help & Support
          </span>
          <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
            <div className="flex items-center gap-3">
              <HelpCircle size={16} className="text-pitch-700 shrink-0" />
              <div>
                <span className="block text-ink-900">User Guide & Rules</span>
                <span className="block text-[10px] text-ink-400 font-medium">Learn how to score and understand cricket rules</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-400" />
          </div>
        </div>

        {/* About App Info */}
        <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block border-b border-ink-100 pb-1.5">
            About RunBook
          </span>

          <div className="flex items-center gap-3 text-xs font-semibold text-ink-700">
            <Info size={16} className="text-pitch-700 shrink-0" />
            <div>
              <span className="block text-ink-900">Version 3.0.0 (MVP Release)</span>
              <span className="block text-[10px] text-ink-400 font-medium">Developed for club & gully cricket scoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 bg-card border-t border-ink-200 shrink-0">
        <button
          onClick={handleSave}
          className="w-full py-3 bg-pitch-700 text-white text-sm font-semibold rounded-xl hover:bg-pitch-600 active:scale-98 transition-transform shadow-md cursor-pointer text-center"
        >
          Confirm Preference Changes
        </button>
      </div>
    </div>
  );
};
export default SettingsScreen;
