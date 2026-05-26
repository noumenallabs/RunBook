import React, { useState } from 'react';
import { useNav } from './nav';
import { 
  ArrowLeft, 
  Search, 
  HelpCircle, 
  BookOpen, 
  Compass, 
  Grid, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

interface FormatDetail {
  name: string;
  overs: string;
  ballsPerOver: number;
  description: string;
}

interface DismissalDetail {
  type: string;
  name: string;
  isBowlerCredited: boolean;
  description: string;
}

export const HelpScreen: React.FC = () => {
  const nav = useNav();
  const [activeTab, setActiveTab] = useState<'quick' | 'keypad' | 'rules' | 'faq'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Accordion state for Rules
  const [openRulesSection, setOpenRulesSection] = useState<string | null>('formats');
  
  // Accordion state for FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const steps = [
    {
      title: "1. Create a Match",
      desc: "Tap 'New Match' on the home screen. Enter team names, select match format (e.g. T20, T10, custom), and configure match settings.",
      icon: <BookOpen className="text-pitch-700 dark:text-pitch-400" size={18} />
    },
    {
      title: "2. Build Roster",
      desc: "Select or add playing XI for both teams. You can customize the squad size. RunBook will warn you if rosters are unequal in size.",
      icon: <Compass className="text-pitch-700 dark:text-pitch-400" size={18} />
    },
    {
      title: "3. Perform Toss",
      desc: "Record coin toss result (Winner & Decision) or skip to go straight into selecting opening batsmen and opening bowler.",
      icon: <Sparkles className="text-pitch-700 dark:text-pitch-400" size={18} />
    },
    {
      title: "4. Input Runs",
      desc: "Tap 0, 1, 2, 3, 4, 6 to log run events. Tap WD (Wide), NB (No Ball), LB (Leg-bye), or B (Bye) to log extras instantly.",
      icon: <Grid className="text-pitch-700 dark:text-pitch-400" size={18} />
    },
    {
      title: "5. Log Dismissals",
      desc: "Tap the amber 'W' key when a wicket falls. Select the batsman dismissed, the fielder involved, and the specific dismissal type.",
      icon: <AlertTriangle className="text-amber-600 dark:text-amber-500" size={18} />
    },
    {
      title: "6. Match Timeline",
      desc: "View ball-by-ball timeline on the scoring sheet. Tap any historical ball dot to edit/delete that specific event.",
      icon: <Clock className="text-pitch-700 dark:text-pitch-400" size={18} />
    },
    {
      title: "7. Undo Mistakes",
      desc: "Made a mistake on the last ball? Tap the 'Undo' button in the scoring bar to reverse the last ball immediately.",
      icon: <RotateCcw className="text-pitch-700 dark:text-pitch-400" size={18} />
    },
    {
      title: "8. View Results",
      desc: "Upon completion, view the final scorecard, full batting & bowling stats, overs timeline, and Player of the Match honors.",
      icon: <Info className="text-pitch-700 dark:text-pitch-400" size={18} />
    }
  ];

  const keypadKeys = [
    { key: '0', label: 'Dot Ball', type: 'runs', color: 'border-ink-200 bg-ink-100 dark:bg-ink-800 text-ink-900', desc: 'No runs scored. Counts as a legal delivery.' },
    { key: '1', label: '1 Run', type: 'runs', color: 'border-ink-200 bg-ink-100 dark:bg-ink-800 text-ink-900', desc: 'Single run scored. Batsmen rotate strike.' },
    { key: '2', label: '2 Runs', type: 'runs', color: 'border-ink-200 bg-ink-100 dark:bg-ink-800 text-ink-900', desc: 'Two runs scored. Batsmen return to starting ends.' },
    { key: '3', label: '3 Runs', type: 'runs', color: 'border-ink-200 bg-ink-100 dark:bg-ink-800 text-ink-900', desc: 'Three runs scored. Batsmen rotate strike.' },
    { key: '4', label: 'Boundary Four', type: 'boundary', color: 'border-pitch-500 bg-pitch-50/50 dark:bg-pitch-900/10 text-pitch-700 dark:text-pitch-400 border-2', desc: 'Four runs scored automatically. Counts as a boundary.' },
    { key: '6', label: 'Six', type: 'six', color: 'bg-pitch-700 dark:bg-pitch-650 text-white font-bold', desc: 'Six runs scored. Ball cleared boundary on full.' },
    { key: 'W', label: 'Wicket', type: 'wicket', color: 'bg-amber-500 text-white font-bold', desc: 'Wicket fell. Opens Wicket Sheet to input details (batsman, fielder, type).' },
    { key: 'WD', label: 'Wide', type: 'extra', color: 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20', desc: 'Ball delivered outside reachable area. Records 1 extra run, bowler must re-bowl.' },
    { key: 'NB', label: 'No Ball', type: 'extra', color: 'border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50/40 dark:bg-purple-950/20', desc: 'Bowler overstepped/illegal delivery. Records 1 extra run, bowler must re-bowl, triggers Free Hit.' },
    { key: 'LB', label: 'Leg Bye', type: 'extra', color: 'border-dashed border-ink-400 text-ink-700 dark:text-ink-300 bg-ink-50 dark:bg-ink-900/40', desc: 'Ball struck batsman body. 1 extra run recorded. Batsman does not get credit for runs.' },
    { key: 'B', label: 'Bye', type: 'extra', color: 'border-dashed border-ink-400 text-ink-700 dark:text-ink-300 bg-ink-50 dark:bg-ink-900/40', desc: 'Ball missed batsman and wicketkeeper. 1 extra run recorded.' },
    { key: '⋯', label: 'Advanced Menu', type: 'advanced', color: 'bg-ink-800 dark:bg-ink-700 text-white', desc: 'Opens options for penalty runs, retirements (hurt/out), custom runs, or overs management.' }
  ];

  const formats: FormatDetail[] = [
    { name: "T20 (Twenty20)", overs: "20 overs per innings", ballsPerOver: 6, description: "Standard professional short format. Maximum 4 overs per bowler." },
    { name: "T10", overs: "10 overs per innings", ballsPerOver: 6, description: "Fast-paced club format. Maximum 2 overs per bowler." },
    { name: "T5", overs: "5 overs per innings", ballsPerOver: 6, description: "Ultra short match. Maximum 1 over per bowler (one can bowl 2)." },
    { name: "Hundred", overs: "100 balls per innings", ballsPerOver: 5, description: "100-ball format. Bowlers bowl 5 or 10 consecutive balls (overs of 5)." },
    { name: "ODI (One Day)", overs: "50 overs per innings", ballsPerOver: 6, description: "Traditional one-day match. Maximum 10 overs per bowler." },
    { name: "Custom Format", overs: "User-defined overs", ballsPerOver: 6, description: "Configure custom overs and bowler limits to suit gully or backyard rules." }
  ];

  const dismissals: DismissalDetail[] = [
    { type: "bowled", name: "Bowled", isBowlerCredited: true, description: "Delivery hits wickets and dislodges bails directly." },
    { type: "caught", name: "Caught", isBowlerCredited: true, description: "Fielder catches ball on the fly off batsman bat." },
    { type: "lbw", name: "Leg Before Wicket (LBW)", isBowlerCredited: true, description: "Delivery strikes batsman pad inline with stumps." },
    { type: "stumped", name: "Stumped", isBowlerCredited: true, description: "Wicketkeeper dislodges bails while batsman is out of crease." },
    { type: "run_out", name: "Run Out", isBowlerCredited: false, description: "Fielder throws down wickets while batsmen are running." },
    { type: "hit_wicket", name: "Hit Wicket", isBowlerCredited: true, description: "Batsman accidentally breaks wickets with bat or body." },
    { type: "retired_hurt", name: "Retired Hurt", isBowlerCredited: false, description: "Batsman retires due to injury. Can return later if needed." },
    { type: "retired_out", name: "Retired Out", isBowlerCredited: false, description: "Batsman retires without injury. Treated as a dismissal." },
    { type: "obstructing", name: "Obstructing the Field", isBowlerCredited: false, description: "Batsman intentionally blocks fielders or ball paths." },
    { type: "hit_twice", name: "Hit Ball Twice", isBowlerCredited: false, description: "Batsman strikes ball twice to defend or score (not to protect stumps)." },
    { type: "timed_out", name: "Timed Out", isBowlerCredited: false, description: "Incoming batsman takes over 3 minutes to face the next ball." }
  ];

  const faqs: FAQItem[] = [
    {
      q: "Is my match progress saved if I refresh the browser?",
      a: "Yes. RunBook stores all scoring transactions and match events in local browser storage (IndexedDB). Reloading, closing, or navigating away from the page will NOT lose your match state.",
      category: "Storage"
    },
    {
      q: "How do I correct a scoring mistake that happened multiple balls ago?",
      a: "Scroll back through the Ball Timeline at the top of the live scoring panel. Tap any historical ball dot to view details, edit the runs/extra type, or delete it entirely. The scoreboard recalculates automatically.",
      category: "Editing"
    },
    {
      q: "What is the difference between Retired Hurt and Retired Out?",
      a: "Retired Hurt indicates a batsman left due to injury; they are NOT dismissed and can return to bat later. Retired Out means the batsman retired tactically; this counts as a wicket, and they cannot return.",
      category: "Rules"
    },
    {
      q: "How are Wide (WD) and No Ball (NB) runs accounted for?",
      a: "Both Wide and No Ball automatically award 1 run to the batting team. This run is credited as an extra. Wides and No Balls must be re-bowled as they are illegal deliveries, and No Balls trigger a Free Hit.",
      category: "Rules"
    },
    {
      q: "Can I set custom player roster counts?",
      a: "Yes, you can input custom roster sizes (e.g. 8 vs 8, 6 vs 6, or even unequal counts). RunBook will display a non-blocking confirmation dialog if rosters don't match, allowing you to proceed anyway.",
      category: "Setup"
    },
    {
      q: "How do I change the bowler or edit the match overs mid-innings?",
      a: "Tap the advanced menu button (⋯) on the keypad to adjust current bowlers, edit match settings, or manually complete/extend overs.",
      category: "Scoring"
    }
  ];

  const filteredFaqs = faqs.filter(
    faq => 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeKeyInfo = selectedKey ? keypadKeys.find(k => k.key === selectedKey) : null;

  return (
    <div className="flex flex-col h-full bg-ink-50 select-none animate-[fadein_120ms_ease]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-200 bg-card flex items-center gap-3 shrink-0">
        <button
          onClick={() => nav.back()}
          className="p-1 -ml-1 text-ink-700 hover:text-ink-900 cursor-pointer rounded-lg hover:bg-ink-100 transition-colors"
          aria-label="Go Back"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-base font-bold text-ink-900">RunBook Help Center</span>
      </div>

      {/* Tabs Menu */}
      <div className="bg-card border-b border-ink-200 flex shrink-0">
        <button
          onClick={() => setActiveTab('quick')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
            activeTab === 'quick' 
              ? 'border-pitch-700 text-pitch-700 dark:border-pitch-400 dark:text-pitch-400' 
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
          type="button"
        >
          Quick Start
        </button>
        <button
          onClick={() => setActiveTab('keypad')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
            activeTab === 'keypad' 
              ? 'border-pitch-700 text-pitch-700 dark:border-pitch-400 dark:text-pitch-400' 
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
          type="button"
        >
          Keypad Legend
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
            activeTab === 'rules' 
              ? 'border-pitch-700 text-pitch-700 dark:border-pitch-400 dark:text-pitch-400' 
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
          type="button"
        >
          Rules & Formats
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
            activeTab === 'faq' 
              ? 'border-pitch-700 text-pitch-700 dark:border-pitch-400 dark:text-pitch-400' 
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
          type="button"
        >
          FAQs
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Tab 1: Quick Start */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-500 font-medium leading-relaxed mb-4">
              Welcome to RunBook cricket scoring. Follow these key steps to get your match set up and score ball-by-ball.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {steps.map((step, idx) => (
                <div key={idx} className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pitch-50 dark:bg-pitch-900/20 flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink-900">{step.title}</h3>
                    <p className="text-[11px] text-ink-500 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Keypad Legend */}
        {activeTab === 'keypad' && (
          <div className="space-y-4">
            <p className="text-xs text-ink-500 font-medium leading-relaxed">
              Tap any key on the visual keypad below to learn how it records deliveries, runs, and extras.
            </p>

            {/* Visual 2x6 Grid */}
            <div className="grid grid-cols-6 gap-2 max-w-md mx-auto aspect-[3/1] bg-ink-100 dark:bg-ink-900/50 p-2 rounded-2xl border border-ink-200">
              {keypadKeys.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  className={`flex flex-col items-center justify-center border rounded-xl font-mono text-xs font-bold active:scale-95 transition-all cursor-pointer ${item.color} ${
                    selectedKey === item.key ? 'ring-2 ring-pitch-500 scale-95 shadow-inner' : 'shadow-sm'
                  }`}
                  type="button"
                >
                  <span>{item.key}</span>
                </button>
              ))}
            </div>

            {/* Selected Key Description details */}
            <div className="bg-card border border-ink-200 rounded-2xl p-4 shadow-sm min-h-[120px] flex flex-col justify-center">
              {activeKeyInfo ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm bg-pitch-50 dark:bg-pitch-950 text-pitch-700 dark:text-pitch-400 border border-pitch-200">
                        {activeKeyInfo.key}
                      </span>
                      <span className="text-xs font-bold text-ink-900">{activeKeyInfo.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500">
                      {activeKeyInfo.type}
                    </span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed font-medium">
                    {activeKeyInfo.desc}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-ink-400">
                  <Info className="mx-auto mb-2 text-ink-300" size={24} />
                  <span className="text-xs font-bold block">No Key Selected</span>
                  <span className="text-[10px] block mt-0.5">Tap a key in the keypad grid above to view details.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Rules & Formats */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            {/* Accordion 1: Match Formats */}
            <div className="bg-card border border-ink-200 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenRulesSection(openRulesSection === 'formats' ? null : 'formats')}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs text-ink-900 hover:bg-ink-50 cursor-pointer"
                type="button"
              >
                <span>Supported Cricket Formats</span>
                {openRulesSection === 'formats' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {openRulesSection === 'formats' && (
                <div className="px-4 pb-4 border-t border-ink-100 pt-3 space-y-3">
                  {formats.map((fmt, idx) => (
                    <div key={idx} className="bg-ink-50/50 dark:bg-ink-900/20 p-2.5 rounded-xl border border-ink-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-ink-900">{fmt.name}</span>
                        <span className="text-[10px] font-bold text-pitch-750 dark:text-pitch-450">{fmt.overs}</span>
                      </div>
                      <span className="block text-[10px] text-ink-400 mt-1 font-medium leading-relaxed">{fmt.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion 2: Dismissal Types */}
            <div className="bg-card border border-ink-200 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenRulesSection(openRulesSection === 'dismissals' ? null : 'dismissals')}
                className="w-full px-4 py-3 flex items-center justify-between font-bold text-xs text-ink-900 hover:bg-ink-50 cursor-pointer"
                type="button"
              >
                <span>Wickets & Dismissals ({dismissals.length} Types)</span>
                {openRulesSection === 'dismissals' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openRulesSection === 'dismissals' && (
                <div className="px-4 pb-4 border-t border-ink-100 pt-3 space-y-2">
                  <p className="text-[10px] text-ink-400 font-medium leading-relaxed mb-2">
                    Under standard cricket laws, batsmen can be dismissed in multiple ways. Some credit the bowler; others do not.
                  </p>
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {dismissals.map((d, idx) => (
                      <div key={idx} className="bg-ink-50/50 dark:bg-ink-900/20 p-2.5 rounded-xl border border-ink-100 flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-ink-900">{d.name}</span>
                          <span className="block text-[10px] text-ink-400 mt-0.5 leading-relaxed">{d.description}</span>
                        </div>
                        <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          d.isBowlerCredited 
                            ? 'bg-pitch-50 dark:bg-pitch-950 text-pitch-700 dark:text-pitch-400 border border-pitch-100' 
                            : 'bg-ink-100 dark:bg-ink-800 text-ink-500'
                        }`}>
                          {d.isBowlerCredited ? 'Bowler Wkt' : 'No Bowler Credit'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: FAQs with client-side filter */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-ink-400" size={16} />
              <input
                type="text"
                placeholder="Search FAQs (e.g. undo, theme, saving)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-ink-200 rounded-xl bg-card text-ink-900 focus:outline-none focus:ring-1 focus:ring-pitch-500"
              />
            </div>

            {/* Accordion FAQ list */}
            {filteredFaqs.length > 0 ? (
              <div className="space-y-2">
                {filteredFaqs.map((faq, idx) => {
                  const actualIndex = faqs.findIndex(f => f.q === faq.q);
                  const isOpen = openFaqIndex === actualIndex;
                  return (
                    <div key={idx} className="bg-card border border-ink-200 rounded-2xl overflow-hidden shadow-sm">
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : actualIndex)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-ink-900 hover:bg-ink-50 cursor-pointer gap-2"
                        type="button"
                      >
                        <span>{faq.q}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-400">
                            {faq.category}
                          </span>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>
                      
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-ink-100 pt-3 text-[11px] text-ink-550 leading-relaxed font-medium">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-400">
                <HelpCircle className="mx-auto mb-2 text-ink-300" size={32} />
                <span className="text-xs font-bold block">No FAQs found matching "{searchQuery}"</span>
                <span className="text-[10px] block mt-0.5">Try using simpler keywords or select another tab.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default HelpScreen;
