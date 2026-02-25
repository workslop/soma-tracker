import { useState, useEffect, useCallback, useMemo } from "react";
import { loadHistory, saveSection as saveSectionToDb } from "./supabase.js";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080c10; --surface: #0d1117; --surface2: #131920; --surface3: #1a2230;
    --border: #1e2d3d; --border2: #263547;
    --accent: #00e5ff; --accent2: #7c3aed; --accent3: #10b981; --accent4: #f59e0b; --accent5: #ef4444;
    --text: #e2e8f0; --text2: #94a3b8; --text3: #475569;
    --mono: 'Space Mono', monospace; --sans: 'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; top: 0; z-index: 100; }
  .logo { font-family: var(--mono); font-size: 13px; color: var(--accent); letter-spacing: 0.15em; text-transform: uppercase; }
  .logo span { color: var(--text3); }
  .date-pill { font-family: var(--mono); font-size: 11px; color: var(--text2); background: var(--surface3); border: 1px solid var(--border); border-radius: 4px; padding: 4px 10px; }
  .nav { display: flex; gap: 4px; }
  .nav-btn { font-family: var(--mono); font-size: 11px; padding: 6px 12px; border-radius: 4px; border: 1px solid transparent; cursor: pointer; transition: all 0.15s; letter-spacing: 0.05em; background: transparent; color: var(--text3); }
  .nav-btn:hover { color: var(--text2); border-color: var(--border); }
  .nav-btn.active { background: var(--surface3); color: var(--accent); border-color: var(--border2); }

  .main { display: grid; grid-template-columns: 1fr 360px; gap: 0; flex: 1; min-height: 0; }
  .left-panel { padding: 24px; overflow-y: auto; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px; }
  .right-panel { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }

  .readiness-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 20px; }
  .score-ring { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
  .score-ring svg { transform: rotate(-90deg); }
  .score-ring .score-val { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: var(--mono); }
  .score-val .num { font-size: 22px; font-weight: 700; line-height: 1; }
  .score-val .lbl { font-size: 8px; color: var(--text3); letter-spacing: 0.1em; margin-top: 2px; }
  .readiness-info { flex: 1; }
  .readiness-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; letter-spacing: 0.05em; }
  .readiness-bars { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
  .r-bar { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 10px; color: var(--text3); }
  .r-bar-track { flex: 1; height: 3px; background: var(--surface3); border-radius: 2px; overflow: hidden; }
  .r-bar-fill { height: 100%; border-radius: 2px; transition: width 0.8s ease; }

  .section-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); cursor: pointer; }
  .section-header:hover { background: var(--surface2); }
  .section-title-row { display: flex; align-items: center; gap: 10px; }
  .section-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .section-name { font-size: 13px; font-weight: 700; letter-spacing: 0.05em; }
  .section-meta { font-family: var(--mono); font-size: 10px; color: var(--text3); margin-top: 2px; }
  .section-toggle { font-family: var(--mono); font-size: 18px; color: var(--text3); }
  .section-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-row { display: grid; gap: 12px; }
  .field-label { font-family: var(--mono); font-size: 10px; color: var(--text3); letter-spacing: 0.1em; text-transform: uppercase; }
  .field input, .field select, .field textarea { background: var(--surface3); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 12px; padding: 8px 12px; outline: none; transition: border-color 0.15s; width: 100%; }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--accent); }
  .field textarea { resize: vertical; min-height: 60px; line-height: 1.5; }
  .field select option { background: var(--surface3); }

  .intensity-row { display: flex; align-items: center; gap: 12px; }
  .intensity-slider { flex: 1; -webkit-appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; background: linear-gradient(to right, var(--accent3), var(--accent4), var(--accent5)); }
  .intensity-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--text); border: 2px solid var(--accent); cursor: pointer; }

  .section-save-btn { align-self: flex-end; font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 5px; border: 1px solid var(--border2); background: var(--surface3); color: var(--text2); cursor: pointer; transition: all 0.15s; }
  .section-save-btn:hover { background: rgba(0,229,255,0.08); color: var(--accent); border-color: var(--accent); }
  .section-save-btn.saved { background: rgba(16,185,129,0.12); color: var(--accent3); border-color: var(--accent3); cursor: default; }
  .section-save-btn:disabled { opacity: 0.6; }

  .ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .ai-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; flex-shrink: 0; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .ai-title { font-family: var(--mono); font-size: 11px; color: var(--accent); letter-spacing: 0.15em; text-transform: uppercase; }
  .ai-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .ai-card-header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
  .ai-card-title { font-family: var(--mono); font-size: 11px; color: var(--text2); letter-spacing: 0.1em; }
  .ai-card-body { padding: 14px 16px; font-family: var(--mono); font-size: 11px; color: var(--text2); line-height: 1.7; }
  .ai-card-body.loading { color: var(--text3); font-style: italic; }
  .ai-analyze-btn { background: linear-gradient(135deg, var(--accent2), #4f46e5); color: #fff; border: none; border-radius: 6px; padding: 10px 16px; font-family: var(--mono); font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.08em; text-transform: uppercase; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .ai-analyze-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .ai-analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .tip-item { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .tip-item:last-child { border-bottom: none; padding-bottom: 0; }
  .tip-icon { font-size: 12px; flex-shrink: 0; margin-top: 1px; }
  .tip-text { font-family: var(--mono); font-size: 11px; color: var(--text2); line-height: 1.6; }
  .tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }

  .exercise-block { background: var(--surface3); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .exercise-name-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--border); }
  .exercise-name { font-size: 12px; font-weight: 700; color: var(--text); letter-spacing: 0.03em; }
  .add-set-btn { font-family: var(--mono); font-size: 10px; color: var(--accent); background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.2); border-radius: 4px; padding: 3px 8px; cursor: pointer; transition: all 0.15s; }
  .add-set-btn:hover { background: rgba(0,229,255,0.15); }
  .set-header { display: grid; grid-template-columns: 28px 1fr 1fr 28px; gap: 6px; padding: 5px 10px; }
  .set-col-label { font-family: var(--mono); font-size: 9px; color: var(--text3); letter-spacing: 0.1em; text-align: center; }
  .set-row { display: grid; grid-template-columns: 28px 1fr 1fr 28px; gap: 6px; padding: 4px 10px; align-items: center; border-top: 1px solid var(--border); }
  .set-num { font-family: var(--mono); font-size: 10px; color: var(--text3); text-align: center; }
  .set-input { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-family: var(--mono); font-size: 12px; padding: 5px 8px; text-align: center; outline: none; transition: border-color 0.15s; width: 100%; }
  .set-input:focus { border-color: var(--accent5); }
  .set-del { background: none; border: none; cursor: pointer; color: var(--text3); font-size: 12px; text-align: center; padding: 0; transition: color 0.15s; }
  .set-del:hover { color: var(--accent5); }
  .zone2-fields { display: flex; flex-direction: column; gap: 10px; }
  .prefill-banner { font-family: var(--mono); font-size: 10px; color: var(--accent); background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.15); border-radius: 6px; padding: 7px 12px; display: flex; align-items: center; gap: 6px; }

  .bw-display { display: flex; align-items: baseline; gap: 6px; }
  .bw-num { font-family: var(--mono); font-size: 32px; font-weight: 700; color: #e879f9; line-height: 1; }
  .bw-unit-lbl { font-family: var(--mono); font-size: 12px; color: var(--text3); }
  .bw-delta { font-family: var(--mono); font-size: 11px; padding: 2px 6px; border-radius: 4px; }
  .bw-delta.up { color: #ef4444; background: rgba(239,68,68,0.1); }
  .bw-delta.down { color: #10b981; background: rgba(16,185,129,0.1); }
  .bw-delta.same { color: var(--text3); background: var(--surface3); }
  .bw-sparkline { width: 100%; height: 48px; margin-top: 8px; }
  .unit-toggle { display: flex; gap: 4px; }
  .unit-btn { font-family: var(--mono); font-size: 10px; padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border); cursor: pointer; background: transparent; color: var(--text3); transition: all 0.15s; }
  .unit-btn.active { background: rgba(232,121,249,0.15); color: #e879f9; border-color: #e879f9; }

  /* HISTORY */
  .history-view { padding: 24px; }
  .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; }
  .history-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
  .history-date { font-family: var(--mono); font-size: 11px; color: var(--accent); margin-bottom: 10px; }
  .history-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid var(--border); }
  .history-row:last-child { border: none; }
  .history-key { font-family: var(--mono); font-size: 10px; color: var(--text3); }
  .history-val { font-family: var(--mono); font-size: 10px; color: var(--text2); }

  /* TRENDS */
  .trends-view { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
  .trend-section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .trend-header { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .trend-title { font-size: 13px; font-weight: 700; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
  .trend-body { padding: 18px; }
  .chart-svg { width: 100%; overflow: visible; }
  .chart-label { font-family: var(--mono); font-size: 9px; fill: #475569; }
  .chart-legend { display: flex; gap: 16px; margin-top: 10px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 10px; color: var(--text2); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; margin-bottom: 16px; }
  .stat-box { background: var(--surface3); border: 1px solid var(--border); border-radius: 6px; padding: 10px; text-align: center; }
  .stat-val { font-family: var(--mono); font-size: 17px; font-weight: 700; }
  .stat-lbl { font-family: var(--mono); font-size: 9px; color: var(--text3); margin-top: 2px; letter-spacing: 0.08em; }
  .ex-select { font-family: var(--mono); font-size: 11px; background: var(--surface3); border: 1px solid var(--border); border-radius: 5px; color: var(--text2); padding: 4px 8px; outline: none; cursor: pointer; }
  .no-data { font-family: var(--mono); font-size: 11px; color: var(--text3); padding: 24px 0; text-align: center; }
  .chart-sub { font-family: var(--mono); font-size: 10px; color: var(--text3); letter-spacing: 0.08em; margin-bottom: 8px; }

  /* CANNABIS */
  .session-list { display: flex; flex-direction: column; gap: 6px; }
  .session-item { display: grid; grid-template-columns: 1fr 1fr 28px; gap: 8px; align-items: center; background: var(--surface3); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; }
  .session-method { font-family: var(--mono); font-size: 11px; color: var(--text2); }
  .session-grams { font-family: var(--mono); font-size: 11px; color: #10b981; text-align: right; }
  .total-bar { display: flex; align-items: center; justify-content: space-between; background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.2); border-radius: 6px; padding: 10px 14px; }
  .total-label { font-family: var(--mono); font-size: 10px; color: var(--text3); letter-spacing: 0.1em; }
  .total-value { font-family: var(--mono); font-size: 20px; font-weight: 700; color: #10b981; }
  .add-session-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: flex-end; }

  .empty-state { text-align: center; padding: 40px; color: var(--text3); font-family: var(--mono); font-size: 12px; }
  .loading-state { display: flex; align-items: center; justify-content: center; min-height: 200px; font-family: var(--mono); font-size: 12px; color: var(--text3); }

  @media (max-width: 900px) {
    .main { grid-template-columns: 1fr; }
    .right-panel { border-top: 1px solid var(--border); }
  }
`;

const WORKOUT_SCHEDULE = [
  { day: "Monday",    label: "Monday — Deadlift",   key: "deadlift"   },
  { day: "Tuesday",   label: "Tuesday — Aesthetic",  key: "aesthetic"  },
  { day: "Wednesday", label: "Wednesday — Bench",    key: "bench"      },
  { day: "Thursday",  label: "Thursday — Zone 2",    key: "zone2_thu"  },
  { day: "Friday",    label: "Friday — Squat",       key: "squat"      },
  { day: "Saturday",  label: "Saturday — Press",     key: "press"      },
  { day: "Sunday",    label: "Sunday — Zone 2",      key: "zone2_sun"  },
];

const WORKOUT_EXERCISES = {
  deadlift:  ["Trap Bar Deadlift","Zercher Squats","Seated Leg Curl","FFE Split Squats","Calf Raises","Cable Twist"],
  aesthetic: ["Lateral Raises","Rear Delt Flyes","Tricep Extension","Incline Curl","Pullover","Cable Curl","Shrug","Face Pulls"],
  bench:     ["Bench Press","Pull Up","Incline Press","Dumbbell Rows","Chest Flyes","Tricep Extension","Cable Curl"],
  zone2_thu: [],
  squat:     ["Zercher Squat","Trap Bar Deadlift","FFE Split Squat","Seated Leg Curl","Box Jump","Calf Raises","Cable Twist"],
  press:     ["Overhead Press","Pull Up","Incline Press","Dumbbell Rows","Chest Flyes","Lateral Raises","Tricep Extension","Incline Curl","Rear Delt Flyes","Shrugs","Face Pull"],
  zone2_sun: [],
};

const ZONE2_DAYS = ["zone2_thu","zone2_sun"];
const MEDITATION_STYLES = ["Mindfulness","Breathwork","Body Scan","Visualization","Loving-Kindness","Transcendental","Guided","Unguided"];

function getTodayKey() { return new Date().toISOString().split("T")[0]; }
function getReadableDate() { return new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}); }

function computeReadiness(data) {
  let s = { sleep: 0, workout: 0, meditation: 0 };
  if (data.sleep?.hours)      s.sleep      = Math.min(100, Math.round((parseFloat(data.sleep.hours)        / 8)  * 100));
  if (data.workout?.duration) s.workout    = Math.min(100, Math.round((parseInt(data.workout.duration)     / 60) * 100));
  if (data.meditation?.sessions?.length) {
    const totalMin = data.meditation.sessions.reduce((t,s)=>t+(parseInt(s.duration)||0),0);
    s.meditation = Math.min(100, Math.round((totalMin / 20) * 100));
  }
  return { overall: Math.round((s.sleep + s.workout + s.meditation) / 3), ...s };
}

// ── SVG line chart ────────────────────────────────────────────────────────
function LineChart({ series, height = 120, xLabels = [] }) {
  const W = 500, H = height;
  const PAD = { top: 10, right: 10, bottom: 28, left: 38 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const allVals = series.flatMap(s => s.data.filter(v => v != null));
  if (!allVals.length) return <div className="no-data">Not enough data yet — keep logging!</div>;
  const minV = Math.min(...allVals), maxV = Math.max(...allVals), range = maxV - minV || 1;
  const maxPts = Math.max(...series.map(s => s.data.length));
  const xS = i => PAD.left + (i / Math.max(maxPts - 1, 1)) * iW;
  const yS = v => PAD.top + iH - ((v - minV) / range) * iH;
  const path = data => data.map((v, i) => v == null ? "" : `${i === 0 || data.slice(0,i).every(x=>x==null) ? "M" : "L"} ${xS(i).toFixed(1)} ${yS(v).toFixed(1)}`).filter(Boolean).join(" ");
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" style={{ height }}>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = minV + (range / ticks) * i, y = yS(v);
        return <g key={i}><line x1={PAD.left} x2={W-PAD.right} y1={y} y2={y} stroke="#1e2d3d" strokeWidth="1"/><text x={PAD.left-4} y={y+3} textAnchor="end" className="chart-label">{Math.round(v)}</text></g>;
      })}
      {xLabels.map((lbl, i) => <text key={i} x={xS(i)} y={H-4} textAnchor="middle" className="chart-label">{lbl}</text>)}
      {series.map(s => (
        <g key={s.label}>
          <path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {s.data.map((v, i) => v != null ? <circle key={i} cx={xS(i)} cy={yS(v)} r="3" fill={s.color}/> : null)}
        </g>
      ))}
    </svg>
  );
}

// ── SVG bar chart ─────────────────────────────────────────────────────────
function BarChart({ bars, height = 120, color = "#00e5ff" }) {
  const W = 500, H = height;
  const PAD = { top: 10, right: 10, bottom: 28, left: 38 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const vals = bars.map(b => b.value).filter(v => v > 0);
  if (!vals.length) return <div className="no-data">Not enough data yet — keep logging!</div>;
  const maxV = Math.max(...vals);
  const barW = (iW / bars.length) * 0.6, gap = iW / bars.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" style={{ height }}>
      {[0,.25,.5,.75,1].map((f,i) => {
        const y = PAD.top + iH * (1-f);
        return <g key={i}><line x1={PAD.left} x2={W-PAD.right} y1={y} y2={y} stroke="#1e2d3d" strokeWidth="1"/><text x={PAD.left-4} y={y+3} textAnchor="end" className="chart-label">{Math.round(maxV*f)}</text></g>;
      })}
      {bars.map((b, i) => {
        const x = PAD.left + gap*i + (gap-barW)/2;
        const bh = b.value ? (b.value/maxV)*iH : 0;
        return (
          <g key={i}>
            <rect x={x} y={PAD.top+iH-bh} width={barW} height={bh} rx="2" fill={color} opacity="0.8"/>
            <text x={x+barW/2} y={H-4} textAnchor="middle" className="chart-label">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState("today");
  const [sections, setSections] = useState({ sleep: true, bodyweight: true, workout: true, meditation: true, cannabis: true });
  const [bwUnit, setBwUnit] = useState(() => localStorage.getItem("bwUnit") || "lbs");
  const [history, setHistory] = useState({});
  const [dbLoading, setDbLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedSection, setSavedSection] = useState({});
  const [selectedExercise, setSelectedExercise] = useState("");

  const [sleep, setSleep] = useState({ hours:"", quality:"", timeToSleep:"", deepSleep:"", remSleep:"", restingHR:"", hrv:"", notes:"" });
  const [bodyweight, setBodyweight] = useState({ value:"", notes:"" });
  const [workout, setWorkout] = useState({ type:"", duration:"", intensity:5, notes:"", sets:{} });
  const [meditation, setMeditation] = useState({ sessions: [] });
  const [newMedSession, setNewMedSession] = useState({ style:"Mindfulness", duration:"" });
  const [newSession, setNewSession] = useState({ method:"Vape", grams:"" });

  useEffect(() => {
    async function load() {
      setDbLoading(true);
      const hist = await loadHistory();
      setHistory(hist);
      const todayKey = getTodayKey();
      if (hist[todayKey]) {
        const d = hist[todayKey];
        if (d.sleep)      setSleep(d.sleep);
        if (d.bodyweight) setBodyweight(d.bodyweight);
        if (d.workout)    setWorkout(d.workout);
        if (d.meditation) {
          // migrate old single-session format { duration, style, notes } to new sessions array
          if (d.meditation.sessions) {
            setMeditation(d.meditation);
          } else if (d.meditation.duration) {
            setMeditation({ sessions: [{ style: d.meditation.style || "Mindfulness", duration: d.meditation.duration, time: "" }] });
          }
        }
        if (d.cannabis)   setCannabis(d.cannabis);
      }
      setDbLoading(false);
    }
    load();
  }, []);

  useEffect(() => { localStorage.setItem("bwUnit", bwUnit); }, [bwUnit]);

  const readiness = computeReadiness({ sleep, workout, meditation, bodyweight });

  // Find last time this workout type was logged and return its sets
  const getLastSets = useCallback((workoutLabel) => {
    if (!workoutLabel) return null;
    const prev = Object.entries(history)
      .filter(([date, d]) => d.workout?.type === workoutLabel && date < getTodayKey())
      .sort((a, b) => b[0].localeCompare(a[0]));
    if (!prev.length) return null;
    return prev[0][1].workout?.sets || null;
  }, [history]);

  const handleWorkoutTypeChange = useCallback((label) => {
    const lastSets = getLastSets(label);
    setWorkout(w => ({
      ...w,
      type: label,
      sets: lastSets ? JSON.parse(JSON.stringify(lastSets)) : {}
    }));
  }, [getLastSets]);

  const handleSaveSection = useCallback(async (sectionName) => {
    const todayKey = getTodayKey();
    const sectionData = { sleep, workout, meditation, bodyweight, cannabis }[sectionName];
    const success = await saveSectionToDb(todayKey, sectionName, sectionData);
    if (success) {
      setHistory(prev => ({ ...prev, [todayKey]: { ...(prev[todayKey]||{}), [sectionName]: sectionData } }));
      setSavedSection(prev => ({ ...prev, [sectionName]: true }));
      setTimeout(() => setSavedSection(prev => ({ ...prev, [sectionName]: false })), 2000);
    }
  }, [sleep, workout, meditation, bodyweight, cannabis]);

  const analyzeWithAI = useCallback(async () => {
    setAiLoading(true); setAiInsights(null);
    try {
      const hist7 = Object.entries(history).slice(-7).map(([date,d]) => ({ date,...d }));
      const prompt = `You are a precision wellness coach. Be data-driven and actionable.

TODAY (${getTodayKey()}):
- Sleep: ${sleep.hours}h, Deep: ${sleep.deepSleep||"?"}h, REM: ${sleep.remSleep||"?"}h, Time to sleep: ${sleep.timeToSleep||"?"}min, RHR: ${sleep.restingHR||"?"}bpm, HRV: ${sleep.hrv||"?"}ms, Eight Sleep Score: ${sleep.quality||"?"}/100${sleep.notes?`, Notes: ${sleep.notes}`:""}
- Bodyweight: ${bodyweight.value?`${bodyweight.value} ${bwUnit}`:"not logged"}${bodyweight.notes?`, Notes: ${bodyweight.notes}`:""}
- Workout: ${workout.type||"none"}, ${workout.duration}min, Intensity: ${workout.intensity}/10${workout.notes?`, Notes: ${workout.notes}`:""}
- Meditation: ${meditation.sessions?.length ? `${meditation.sessions.length} session(s), ${meditation.sessions.reduce((t,s)=>t+(parseInt(s.duration)||0),0)}min total (${meditation.sessions.map(s=>`${s.duration}min ${s.style}`).join(", ")})` : "none"}
HISTORY (last ${hist7.length} days):
${hist7.map(e=>{
      const med = e.meditation;
      const medMin = med?.sessions ? med.sessions.reduce((t,s)=>t+(parseInt(s.duration)||0),0) : (med?.duration ? parseInt(med.duration) : 0);
      return `${e.date}: sleep ${e.sleep?.hours}h (score ${e.sleep?.quality||"?"}/100, HRV ${e.sleep?.hrv||"?"}ms, RHR ${e.sleep?.restingHR||"?"}bpm), bw ${e.bodyweight?.value||"?"}${bwUnit}, workout ${e.workout?.type} ${e.workout?.duration}min, meditation ${medMin}min`;
    }).join("\n")||"No history yet"}

Respond ONLY with valid JSON (no markdown):
{"readiness":{"score":number,"label":"Optimal/Good/Moderate/Low/Rest Day","summary":"1-2 sentences"},"tips":[{"icon":"emoji","category":"string","text":"specific tip with numbers"}],"patterns":"2-3 sentences","tomorrow":"1-2 sentences"}`;

      const res = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] }) });
      const data = await res.json();
      const text = data.content.map(i=>i.text||"").join("");
      setAiInsights(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch(e) {
      setAiInsights({ error:"Analysis failed. Make sure you have data logged and try again." });
    }
    setAiLoading(false);
  }, [sleep, bodyweight, workout, meditation, history, bwUnit]);

  const toggleSection = s => setSections(prev => ({ ...prev, [s]: !prev[s] }));

  const addSet    = ex => setWorkout(w => ({ ...w, sets: { ...w.sets, [ex]: [...(w.sets?.[ex]||[]), {reps:"",weight:""}] } }));
  const updateSet = (ex,idx,field,val) => { const c=[...(workout.sets?.[ex]||[])]; c[idx]={...c[idx],[field]:val}; setWorkout(w=>({...w,sets:{...w.sets,[ex]:c}})); };
  const removeSet = (ex,idx) => { const c=[...(workout.sets?.[ex]||[])]; c.splice(idx,1); setWorkout(w=>({...w,sets:{...w.sets,[ex]:c}})); };

  const selectedSchedule = WORKOUT_SCHEDULE.find(w => w.label === workout.type);
  const exercises = selectedSchedule ? (WORKOUT_EXERCISES[selectedSchedule.key]||[]) : [];
  const isZone2   = selectedSchedule ? ZONE2_DAYS.includes(selectedSchedule.key) : false;
  const hasPrefill = !isZone2 && workout.type ? getLastSets(workout.type) !== null : false;

  // Sparkline
  const bwHist = Object.entries(history).filter(([,d])=>d.bodyweight?.value).sort((a,b)=>a[0].localeCompare(b[0])).slice(-14).map(([,d])=>parseFloat(d.bodyweight.value));
  const bwToday = parseFloat(bodyweight.value)||null;
  const sparkPts = [...bwHist,...(bwToday?[bwToday]:[])];
  const bwMin = sparkPts.length ? Math.min(...sparkPts)-2 : 0;
  const bwMax2 = sparkPts.length ? Math.max(...sparkPts)+2 : 100;
  const bwRange = bwMax2-bwMin||1;
  const lastBw = bwHist.length ? bwHist[bwHist.length-1] : null;
  const bwDelta = bwToday && lastBw ? (bwToday-lastBw).toFixed(1) : null;
  const sparkPath = sparkPts.length ? sparkPts.map((p,i)=>`${i===0?"M":"L"} ${(i*300/Math.max(sparkPts.length-1,1)).toFixed(1)} ${(40-((p-bwMin)/bwRange)*40).toFixed(1)}`).join(" ") : "";

  const rColor = readiness.overall>=80?"#10b981":readiness.overall>=60?"#00e5ff":readiness.overall>=40?"#f59e0b":"#ef4444";
  const circ = 2*Math.PI*34;
  const dash = circ-(readiness.overall/100)*circ;

  // ── Trends data ───────────────────────────────────────────────────────────
  const trendDays = useMemo(() => Object.entries(history).sort((a,b)=>a[0].localeCompare(b[0])).slice(-30), [history]);
  const tLabels   = trendDays.map(([d])=>d.slice(5));

  // Sparse x-labels (every ~5th)
  const sparseLabels = tLabels.map((l,i) => i===0||i===tLabels.length-1||(i+1)%5===0?l:"");

  const sleepMetricSeries = useMemo(() => [
    { label:"Eight Sleep Score", color:"#a78bfa", data: trendDays.map(([,d])=>d.sleep?.quality?parseFloat(d.sleep.quality):null) },
    { label:"HRV (ms)",          color:"#00e5ff", data: trendDays.map(([,d])=>d.sleep?.hrv?parseFloat(d.sleep.hrv):null) },
    { label:"Resting HR (bpm)",  color:"#ef4444", data: trendDays.map(([,d])=>d.sleep?.restingHR?parseFloat(d.sleep.restingHR):null) },
  ], [trendDays]);

  const sleepStageSeries = useMemo(() => [
    { label:"Total Sleep",  color:"#a78bfa", data: trendDays.map(([,d])=>d.sleep?.hours?parseFloat(d.sleep.hours):null) },
    { label:"Deep Sleep",   color:"#4f46e5", data: trendDays.map(([,d])=>d.sleep?.deepSleep?parseFloat(d.sleep.deepSleep):null) },
    { label:"REM Sleep",    color:"#818cf8", data: trendDays.map(([,d])=>d.sleep?.remSleep?parseFloat(d.sleep.remSleep):null) },
  ], [trendDays]);

  const bwSeries = useMemo(() => [
    { label:`Bodyweight (${bwUnit})`, color:"#e879f9", data: trendDays.map(([,d])=>d.bodyweight?.value?parseFloat(d.bodyweight.value):null) },
  ], [trendDays, bwUnit]);

  const workoutBars    = useMemo(() => trendDays.map(([date,d])=>({ label:date.slice(5), value:d.workout?.duration?parseInt(d.workout.duration):0 })), [trendDays]);
  const meditationBars = useMemo(() => trendDays.map(([date,d])=>{
    const med = d.meditation;
    const val = med?.sessions ? med.sessions.reduce((t,s)=>t+(parseInt(s.duration)||0),0) : (med?.duration ? parseInt(med.duration) : 0);
    return { label:date.slice(5), value: val };
  }), [trendDays]);

  const allExercises = useMemo(() => {
    const s = new Set();
    Object.values(history).forEach(d => { if (d.workout?.sets) Object.keys(d.workout.sets).forEach(e=>s.add(e)); });
    return Array.from(s).sort();
  }, [history]);

  const exProgressionSeries = useMemo(() => {
    if (!selectedExercise) return { series:[], xLabels:[] };
    const pts = Object.entries(history)
      .filter(([,d])=>d.workout?.sets?.[selectedExercise]?.length)
      .sort((a,b)=>a[0].localeCompare(b[0])).slice(-16)
      .map(([date,d]) => {
        const sets = d.workout.sets[selectedExercise];
        const topW = Math.max(...sets.map(s=>parseFloat(s.weight)||0));
        const vol  = sets.reduce((sum,s)=>(sum+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)),0);
        return { label: date.slice(5), topW, vol };
      });
    if (!pts.length) return { series:[], xLabels:[] };
    return {
      series: [
        { label:"Top Weight (lbs)", color:"#f59e0b", data: pts.map(p=>p.topW) },
        { label:"Volume ÷10",       color:"#10b981", data: pts.map(p=>p.vol/10) },
      ],
      xLabels: pts.map(p=>p.label),
    };
  }, [selectedExercise, history]);

  const sleepAvgs = useMemo(() => {
    const vals = trendDays.map(([,d])=>d.sleep).filter(Boolean);
    const avg = fn => { const v=vals.map(fn).filter(x=>x!=null&&x!=""); return v.length?(v.reduce((a,b)=>a+parseFloat(b),0)/v.length).toFixed(1):"—"; };
    return {
      score: avg(s=>s.quality), hours: avg(s=>s.hours), hrv: avg(s=>s.hrv),
      rhr: avg(s=>s.restingHR), deep: avg(s=>s.deepSleep), rem: avg(s=>s.remSleep),
    };
  }, [trendDays]);

  if (dbLoading) return (
    <><style>{STYLES}</style>
    <div className="app">
      <header className="header"><div className="logo">SOMA<span>/</span>TRACK</div></header>
      <div className="loading-state">Loading your data...</div>
    </div></>
  );

  return (
    <><style>{STYLES}</style>
    <div className="app">
      <header className="header">
        <div className="logo">SOMA<span>/</span>TRACK</div>
        <div className="nav">
          <button className={`nav-btn ${view==="today"?"active":""}`}   onClick={()=>setView("today")}>TODAY</button>
          <button className={`nav-btn ${view==="trends"?"active":""}`}  onClick={()=>setView("trends")}>TRENDS</button>
          <button className={`nav-btn ${view==="history"?"active":""}`} onClick={()=>setView("history")}>HISTORY</button>
        </div>
        <div className="date-pill">{getReadableDate()}</div>
      </header>

      {/* ── HISTORY ── */}
      {view==="history" && (
        <div className="history-view">
          <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--text3)",letterSpacing:"0.1em",textTransform:"uppercase"}}>PAST ENTRIES</div>
          {!Object.keys(history).length ? <div className="empty-state">No history yet.</div> : (
            <div className="history-grid">
              {Object.entries(history).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,d])=>{
                const r=computeReadiness(d);
                return (
                  <div className="history-card" key={date}>
                    <div className="history-date">{date} — Readiness: {r.overall}%</div>
                    {d.sleep?.hours     && <div className="history-row"><span className="history-key">💤 Sleep</span><span className="history-val">{d.sleep.hours}h · Score {d.sleep.quality||"—"}/100{d.sleep.hrv?` · HRV ${d.sleep.hrv}ms`:""}{d.sleep.restingHR?` · ${d.sleep.restingHR}bpm`:""}</span></div>}
                    {d.bodyweight?.value && <div className="history-row"><span className="history-key">⚖️ Weight</span><span className="history-val">{d.bodyweight.value} {bwUnit}</span></div>}
                    {d.workout?.type    && <div className="history-row"><span className="history-key">🏋️ Workout</span><span className="history-val">{d.workout.type.split("—")[1]?.trim()} · {d.workout.duration}min</span></div>}
                    {(d.meditation?.sessions?.length>0 || d.meditation?.duration) && <div className="history-row"><span className="history-key">🧘 Meditation</span><span className="history-val">{d.meditation.sessions ? `${d.meditation.sessions.length} session${d.meditation.sessions.length!==1?"s":""} · ${d.meditation.sessions.reduce((t,s)=>t+(parseInt(s.duration)||0),0)}min` : `${d.meditation.duration}min · ${d.meditation.style}`}</span></div>}
                    {d.cannabis?.sessions?.length>0 && <div className="history-row"><span className="history-key">🌿 Cannabis</span><span className="history-val">{d.cannabis.sessions.length} session{d.cannabis.sessions.length!==1?"s":""} · {d.cannabis.sessions.reduce((t,s)=>t+(parseFloat(s.grams)||0),0).toFixed(2)}g</span></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TRENDS ── */}
      {view==="trends" && (
        <div className="trends-view">

          {/* Sleep metrics */}
          <div className="trend-section">
            <div className="trend-header">
              <div className="trend-title" style={{color:"#a78bfa"}}>💤 SLEEP METRICS</div>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)"}}>30-DAY</span>
            </div>
            <div className="trend-body">
              <div className="stat-grid">
                {[
                  {lbl:"AVG SCORE",val:sleepAvgs.score,color:"#a78bfa",sfx:"/100"},
                  {lbl:"AVG HRV",  val:sleepAvgs.hrv,  color:"#00e5ff",sfx:"ms"},
                  {lbl:"AVG RHR",  val:sleepAvgs.rhr,  color:"#ef4444",sfx:"bpm"},
                  {lbl:"AVG SLEEP",val:sleepAvgs.hours, color:"#7c3aed",sfx:"h"},
                  {lbl:"AVG DEEP", val:sleepAvgs.deep,  color:"#4f46e5",sfx:"h"},
                  {lbl:"AVG REM",  val:sleepAvgs.rem,   color:"#818cf8",sfx:"h"},
                ].map(s=>(
                  <div className="stat-box" key={s.lbl}>
                    <div className="stat-val" style={{color:s.color}}>{s.val}{s.val!=="—"?s.sfx:""}</div>
                    <div className="stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="chart-sub">SCORE · HRV · RESTING HR</div>
              <LineChart series={sleepMetricSeries} height={130} xLabels={sparseLabels}/>
              <div className="chart-legend">{sleepMetricSeries.map(s=><div key={s.label} className="legend-item"><div className="legend-dot" style={{background:s.color}}/>{s.label}</div>)}</div>
              <div className="chart-sub" style={{marginTop:16}}>SLEEP STAGES (hours)</div>
              <LineChart series={sleepStageSeries} height={110} xLabels={sparseLabels}/>
              <div className="chart-legend" style={{marginTop:8}}>{sleepStageSeries.map(s=><div key={s.label} className="legend-item"><div className="legend-dot" style={{background:s.color}}/>{s.label}</div>)}</div>
            </div>
          </div>

          {/* Bodyweight */}
          <div className="trend-section">
            <div className="trend-header">
              <div className="trend-title" style={{color:"#e879f9"}}>⚖️ BODYWEIGHT</div>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)"}}>30-DAY</span>
            </div>
            <div className="trend-body">
              {(() => {
                const vals = bwSeries[0]?.data.filter(Boolean);
                if (!vals?.length) return null;
                const first=vals[0],last=vals[vals.length-1],diff=(last-first).toFixed(1);
                return (
                  <div className="stat-grid" style={{marginBottom:16}}>
                    {[
                      {lbl:"CURRENT",val:last,color:"#e879f9"},
                      {lbl:"30D CHANGE",val:(parseFloat(diff)>0?"+":"")+diff,color:parseFloat(diff)>0?"#ef4444":"#10b981"},
                      {lbl:"LOW",val:Math.min(...vals).toFixed(1),color:"#e879f9"},
                      {lbl:"HIGH",val:Math.max(...vals).toFixed(1),color:"#e879f9"},
                    ].map(s=><div className="stat-box" key={s.lbl}><div className="stat-val" style={{color:s.color}}>{s.val}</div><div className="stat-lbl">{s.lbl}</div></div>)}
                  </div>
                );
              })()}
              <LineChart series={bwSeries} height={130} xLabels={sparseLabels}/>
            </div>
          </div>

          {/* Workout duration */}
          <div className="trend-section">
            <div className="trend-header">
              <div className="trend-title" style={{color:"#f87171"}}>🏋️ WORKOUT DURATION</div>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)"}}>30-DAY</span>
            </div>
            <div className="trend-body">
              <BarChart bars={workoutBars} height={130} color="#ef4444"/>
              <div className="chart-sub" style={{marginTop:8}}>Minutes per session</div>
            </div>
          </div>

          {/* Exercise progression */}
          <div className="trend-section">
            <div className="trend-header">
              <div className="trend-title" style={{color:"#f59e0b"}}>📈 EXERCISE PROGRESSION</div>
              <select className="ex-select" value={selectedExercise} onChange={e=>setSelectedExercise(e.target.value)}>
                <option value="">Select exercise</option>
                {allExercises.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="trend-body">
              {!selectedExercise ? <div className="no-data">Select an exercise above to view progression</div>
               : !exProgressionSeries.series.length ? <div className="no-data">No logged sets for {selectedExercise} yet</div>
               : <>
                   <LineChart series={exProgressionSeries.series} height={130} xLabels={exProgressionSeries.xLabels}/>
                   <div className="chart-legend" style={{marginTop:8}}>
                     {exProgressionSeries.series.map(s=><div key={s.label} className="legend-item"><div className="legend-dot" style={{background:s.color}}/>{s.label}</div>)}
                   </div>
                 </>
              }
            </div>
          </div>

          {/* Meditation */}
          <div className="trend-section">
            <div className="trend-header">
              <div className="trend-title" style={{color:"#34d399"}}>🧘 MEDITATION</div>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)"}}>30-DAY</span>
            </div>
            <div className="trend-body">
              <BarChart bars={meditationBars} height={110} color="#10b981"/>
              <div className="chart-sub" style={{marginTop:8}}>Minutes per session</div>
            </div>
          </div>

        </div>
      )}

      {/* ── TODAY ── */}
      {view==="today" && (
        <div className="main">
          <div className="left-panel">

            {/* Readiness ring */}
            <div className="readiness-card">
              <div className="score-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface3)" strokeWidth="6"/>
                  <circle cx="40" cy="40" r="34" fill="none" stroke={rColor} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s ease"}}/>
                </svg>
                <div className="score-val"><div className="num" style={{color:rColor}}>{readiness.overall}</div><div className="lbl">READY</div></div>
              </div>
              <div className="readiness-info">
                <div className="readiness-title">DAILY READINESS</div>
                <div className="readiness-bars">
                  {[{lbl:"SLEEP",val:readiness.sleep,color:"var(--accent2)"},{lbl:"TRAINING",val:readiness.workout,color:"var(--accent5)"},{lbl:"MINDFULNESS",val:readiness.meditation,color:"var(--accent3)"}].map(b=>(
                    <div className="r-bar" key={b.lbl}>
                      <span style={{width:80}}>{b.lbl}</span>
                      <div className="r-bar-track"><div className="r-bar-fill" style={{width:`${b.val}%`,background:b.color}}/></div>
                      <span style={{width:26,textAlign:"right",color:"var(--text2)"}}>{b.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SLEEP */}
            <div className="section-card">
              <div className="section-header" onClick={()=>toggleSection("sleep")}>
                <div className="section-title-row">
                  <div className="section-icon" style={{background:"rgba(124,58,237,0.15)"}}>💤</div>
                  <div>
                    <div className="section-name" style={{color:"#a78bfa"}}>SLEEP</div>
                    <div className="section-meta">{sleep.hours?`${sleep.hours}h · Score ${sleep.quality||"—"}/100${sleep.hrv?` · HRV ${sleep.hrv}ms`:""}${sleep.restingHR?` · ${sleep.restingHR}bpm`:""}` : "Not logged"}</div>
                  </div>
                </div>
                <div className="section-toggle">{sections.sleep?"−":"+"}</div>
              </div>
              {sections.sleep && (
                <div className="section-body">
                  <div className="field-row" style={{gridTemplateColumns:"1fr 1fr"}}>
                    <div className="field"><div className="field-label">Total Sleep (hrs)</div><input type="number" min="0" max="24" step="0.5" placeholder="7.5" value={sleep.hours} onChange={e=>setSleep({...sleep,hours:e.target.value})}/></div>
                    <div className="field"><div className="field-label">Sleep Score (0–100)</div><input type="number" min="0" max="100" placeholder="82" value={sleep.quality} onChange={e=>setSleep({...sleep,quality:e.target.value})}/></div>
                  </div>
                  <div className="field-row" style={{gridTemplateColumns:"1fr 1fr"}}>
                    <div className="field"><div className="field-label">Deep Sleep (hrs)</div><input type="number" min="0" max="12" step="0.1" placeholder="1.5" value={sleep.deepSleep} onChange={e=>setSleep({...sleep,deepSleep:e.target.value})}/></div>
                    <div className="field"><div className="field-label">REM Sleep (hrs)</div><input type="number" min="0" max="12" step="0.1" placeholder="2.0" value={sleep.remSleep} onChange={e=>setSleep({...sleep,remSleep:e.target.value})}/></div>
                  </div>
                  <div className="field-row" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
                    <div className="field"><div className="field-label">Time to Sleep (min)</div><input type="number" min="0" placeholder="15" value={sleep.timeToSleep} onChange={e=>setSleep({...sleep,timeToSleep:e.target.value})}/></div>
                    <div className="field"><div className="field-label">Resting HR (bpm)</div><input type="number" min="0" placeholder="58" value={sleep.restingHR} onChange={e=>setSleep({...sleep,restingHR:e.target.value})}/></div>
                    <div className="field"><div className="field-label">HRV (ms)</div><input type="number" min="0" placeholder="65" value={sleep.hrv} onChange={e=>setSleep({...sleep,hrv:e.target.value})}/></div>
                  </div>
                  <div className="field"><div className="field-label">Notes</div><textarea placeholder="Dream quality, woke up times, sleep window..." value={sleep.notes} onChange={e=>setSleep({...sleep,notes:e.target.value})}/></div>
                  <button className={`section-save-btn ${savedSection.sleep?"saved":""}`} onClick={()=>handleSaveSection("sleep")} disabled={savedSection.sleep}>{savedSection.sleep?"✓ SAVED":"SAVE SLEEP"}</button>
                </div>
              )}
            </div>

            {/* BODYWEIGHT */}
            <div className="section-card">
              <div className="section-header" onClick={()=>toggleSection("bodyweight")}>
                <div className="section-title-row">
                  <div className="section-icon" style={{background:"rgba(232,121,249,0.15)"}}>⚖️</div>
                  <div>
                    <div className="section-name" style={{color:"#e879f9"}}>BODYWEIGHT</div>
                    <div className="section-meta">{bodyweight.value?`${bodyweight.value} ${bwUnit}${bwDelta?` · ${parseFloat(bwDelta)>0?"+":""}${bwDelta} from prev`:""}` : "Not logged"}</div>
                  </div>
                </div>
                <div className="section-toggle">{sections.bodyweight?"−":"+"}</div>
              </div>
              {sections.bodyweight && (
                <div className="section-body">
                  <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                    <div className="bw-display">
                      <div className="bw-num">{bodyweight.value||"—"}</div>
                      <div className="bw-unit-lbl">{bwUnit}</div>
                      {bwDelta!==null && <div className={`bw-delta ${parseFloat(bwDelta)>0?"up":parseFloat(bwDelta)<0?"down":"same"}`}>{parseFloat(bwDelta)>0?"▲":parseFloat(bwDelta)<0?"▼":"="} {Math.abs(bwDelta)}</div>}
                    </div>
                    <div className="unit-toggle">{["lbs","kg"].map(u=><button key={u} className={`unit-btn ${bwUnit===u?"active":""}`} onClick={()=>setBwUnit(u)}>{u}</button>)}</div>
                  </div>
                  <div className="field"><div className="field-label">Weight ({bwUnit})</div><input type="number" step="0.1" min="0" placeholder={bwUnit==="lbs"?"175.0":"79.4"} value={bodyweight.value} onChange={e=>setBodyweight({...bodyweight,value:e.target.value})}/></div>
                  {sparkPts.length>1 && (
                    <div>
                      <div className="field-label" style={{marginBottom:6}}>14-DAY TREND</div>
                      <svg className="bw-sparkline" viewBox="0 0 300 40" preserveAspectRatio="none">
                        <defs><linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e879f9" stopOpacity="0.3"/><stop offset="100%" stopColor="#e879f9" stopOpacity="0"/></linearGradient></defs>
                        <path d={`${sparkPath} L ${((sparkPts.length-1)*300/Math.max(sparkPts.length-1,1)).toFixed(1)} 40 L 0 40 Z`} fill="url(#bwGrad)"/>
                        <path d={sparkPath} fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        {sparkPts.map((p,i)=>{const x=(i*300/Math.max(sparkPts.length-1,1)).toFixed(1),y=(40-((p-bwMin)/bwRange)*40).toFixed(1);return <circle key={i} cx={x} cy={y} r={i===sparkPts.length-1?"3":"2"} fill={i===sparkPts.length-1?"#e879f9":"#7c3aed"}/>;})}
                      </svg>
                      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--mono)",fontSize:9,color:"var(--text3)",marginTop:2}}>
                        <span>{Math.min(...sparkPts).toFixed(1)} {bwUnit}</span><span style={{color:"var(--text2)"}}>LOW → HIGH</span><span>{Math.max(...sparkPts).toFixed(1)} {bwUnit}</span>
                      </div>
                    </div>
                  )}
                  <div className="field"><div className="field-label">Notes</div><textarea placeholder="Morning weight, post-workout, water retention notes..." value={bodyweight.notes} onChange={e=>setBodyweight({...bodyweight,notes:e.target.value})}/></div>
                  <button className={`section-save-btn ${savedSection.bodyweight?"saved":""}`} onClick={()=>handleSaveSection("bodyweight")} disabled={savedSection.bodyweight}>{savedSection.bodyweight?"✓ SAVED":"SAVE WEIGHT"}</button>
                </div>
              )}
            </div>

            {/* WORKOUT */}
            <div className="section-card">
              <div className="section-header" onClick={()=>toggleSection("workout")}>
                <div className="section-title-row">
                  <div className="section-icon" style={{background:"rgba(239,68,68,0.15)"}}>🏋️</div>
                  <div>
                    <div className="section-name" style={{color:"#f87171"}}>WORKOUT</div>
                    <div className="section-meta">{workout.type?`${workout.type.split("—")[1]?.trim()} · ${workout.duration||0}min${!isZone2&&exercises.length?` · ${exercises.filter(e=>(workout.sets?.[e]||[]).length>0).length}/${exercises.length} exercises`:""}` : "Not logged"}</div>
                  </div>
                </div>
                <div className="section-toggle">{sections.workout?"−":"+"}</div>
              </div>
              {sections.workout && (
                <div className="section-body">
                  <div className="field-row" style={{gridTemplateColumns:"1fr 1fr"}}>
                    <div className="field">
                      <div className="field-label">Workout</div>
                      <select value={workout.type} onChange={e=>handleWorkoutTypeChange(e.target.value)}>
                        <option value="">Select day</option>
                        {WORKOUT_SCHEDULE.map(w=><option key={w.key} value={w.label}>{w.label}</option>)}
                      </select>
                    </div>
                    <div className="field"><div className="field-label">Duration (min)</div><input type="number" min="0" placeholder="60" value={workout.duration} onChange={e=>setWorkout({...workout,duration:e.target.value})}/></div>
                  </div>

                  {hasPrefill && (
                    <div className="prefill-banner">↑ Pre-loaded with last session's sets — adjust weights &amp; reps as needed</div>
                  )}

                  {isZone2 && (
                    <div className="zone2-fields">
                      <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)",letterSpacing:"0.1em"}}>ZONE 2 CARDIO</div>
                      <div className="field-row" style={{gridTemplateColumns:"1fr 1fr"}}>
                        <div className="field"><div className="field-label">Modality</div>
                          <select value={workout.modality||""} onChange={e=>setWorkout({...workout,modality:e.target.value,resistance:""})}>
                            <option value="">Select</option><option>Treadmill</option><option>Heavy Bag</option>
                          </select>
                        </div>
                        <div className="field"><div className="field-label">Avg HR (bpm)</div><input type="number" placeholder="135" value={workout.avgHr||""} onChange={e=>setWorkout({...workout,avgHr:e.target.value})}/></div>
                      </div>
                      <div className="field-row" style={{gridTemplateColumns:workout.modality==="Treadmill"?"1fr 1fr":"1fr"}}>
                        <div className="field"><div className="field-label">Distance (mi)</div><input type="number" step="0.1" placeholder="3.0" value={workout.distance||""} onChange={e=>setWorkout({...workout,distance:e.target.value})}/></div>
                        {workout.modality==="Treadmill" && <div className="field"><div className="field-label">Incline (%)</div><input type="number" min="0" max="15" step="0.5" placeholder="2.0" value={workout.resistance||""} onChange={e=>setWorkout({...workout,resistance:e.target.value})}/></div>}
                      </div>
                    </div>
                  )}

                  {!isZone2 && exercises.length>0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Exercises</div>
                      {exercises.map(exName=>{
                        const sets=workout.sets?.[exName]||[];
                        const best=sets.reduce((b,s)=>parseFloat(s.weight)>parseFloat(b.weight||0)?s:b,{});
                        return (
                          <div className="exercise-block" key={exName}>
                            <div className="exercise-name-row">
                              <span className="exercise-name">{exName}</span>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                {sets.length>0 && <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--text3)"}}>{sets.length} set{sets.length!==1?"s":""}{best.weight?` · top ${best.weight}lbs`:""}</span>}
                                <button className="add-set-btn" onClick={()=>addSet(exName)}>+ SET</button>
                              </div>
                            </div>
                            {sets.length>0 ? (
                              <div>
                                <div className="set-header"><div className="set-col-label">SET</div><div className="set-col-label">WEIGHT (lbs)</div><div className="set-col-label">REPS</div><div/></div>
                                {sets.map((set,idx)=>(
                                  <div className="set-row" key={idx}>
                                    <div className="set-num">{idx+1}</div>
                                    <input className="set-input" type="number" min="0" step="2.5" placeholder="135" value={set.weight} onChange={e=>updateSet(exName,idx,"weight",e.target.value)}/>
                                    <input className="set-input" type="number" min="0" placeholder="8"   value={set.reps}   onChange={e=>updateSet(exName,idx,"reps",e.target.value)}/>
                                    <button className="set-del" onClick={()=>removeSet(exName,idx)}>✕</button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{padding:"8px 12px",fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)"}}>No sets logged — tap + SET to begin</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="field">
                    <div className="field-label">Intensity — {workout.intensity}/10</div>
                    <div className="intensity-row">
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)"}}>LOW</span>
                      <input type="range" className="intensity-slider" min="1" max="10" value={workout.intensity} onChange={e=>setWorkout({...workout,intensity:parseInt(e.target.value)})}/>
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)"}}>MAX</span>
                    </div>
                  </div>
                  <div className="field"><div className="field-label">Notes</div><textarea placeholder="How you felt, PRs, anything notable..." value={workout.notes} onChange={e=>setWorkout({...workout,notes:e.target.value})}/></div>
                  <button className={`section-save-btn ${savedSection.workout?"saved":""}`} onClick={()=>handleSaveSection("workout")} disabled={savedSection.workout}>{savedSection.workout?"✓ SAVED":"SAVE WORKOUT"}</button>
                </div>
              )}
            </div>

            {/* MEDITATION */}
            <div className="section-card">
              <div className="section-header" onClick={()=>toggleSection("meditation")}>
                <div className="section-title-row">
                  <div className="section-icon" style={{background:"rgba(16,185,129,0.15)"}}>🧘</div>
                  <div>
                    <div className="section-name" style={{color:"#34d399"}}>MEDITATION</div>
                    <div className="section-meta">
                      {meditation.sessions?.length
                        ? `${meditation.sessions.length} session${meditation.sessions.length!==1?"s":""} · ${meditation.sessions.reduce((t,s)=>t+(parseInt(s.duration)||0),0)}min total`
                        : "Not logged"}
                    </div>
                  </div>
                </div>
                <div className="section-toggle">{sections.meditation?"−":"+"}</div>
              </div>
              {sections.meditation && (
                <div className="section-body">
                  {/* Running total */}
                  {meditation.sessions?.length>0 && (
                    <div className="total-bar" style={{borderColor:"rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.07)"}}>
                      <div><div className="total-label">TOTAL TODAY</div><div className="total-value" style={{color:"#34d399"}}>{meditation.sessions.reduce((t,s)=>t+(parseInt(s.duration)||0),0)}<span style={{fontSize:12,color:"var(--text3)",marginLeft:4}}>min</span></div></div>
                      <div style={{textAlign:"right"}}>
                        <div className="total-label">SESSIONS</div>
                        <div style={{fontFamily:"var(--mono)",fontSize:20,fontWeight:700,color:"#34d399"}}>{meditation.sessions.length}</div>
                      </div>
                    </div>
                  )}

                  {/* Session list */}
                  {meditation.sessions?.length>0 && (
                    <div className="session-list">
                      {meditation.sessions.map((s,i)=>(
                        <div className="session-item" key={i}>
                          <span className="session-method">#{i+1} · {s.style}</span>
                          <span className="session-grams" style={{color:"#34d399"}}>{s.duration}min</span>
                          <button className="set-del" onClick={()=>setMeditation(m=>({...m,sessions:m.sessions.filter((_,idx)=>idx!==i)}))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add session */}
                  <div className="add-session-row">
                    <div className="field">
                      <div className="field-label">Style</div>
                      <select value={newMedSession.style} onChange={e=>setNewMedSession({...newMedSession,style:e.target.value})}>
                        {MEDITATION_STYLES.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <div className="field-label">Duration (min)</div>
                      <input type="number" min="0" placeholder="20" value={newMedSession.duration} onChange={e=>setNewMedSession({...newMedSession,duration:e.target.value})}/>
                    </div>
                    <button className="add-set-btn" style={{marginBottom:1,padding:"8px 14px",fontSize:11}} onClick={()=>{
                      if(!newMedSession.duration) return;
                      setMeditation(m=>({...m,sessions:[...(m.sessions||[]),{style:newMedSession.style,duration:newMedSession.duration,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}]}));
                      setNewMedSession({style:newMedSession.style,duration:""});
                    }}>+ ADD</button>
                  </div>

                  <button className={`section-save-btn ${savedSection.meditation?"saved":""}`} onClick={()=>handleSaveSection("meditation")} disabled={savedSection.meditation}>{savedSection.meditation?"✓ SAVED":"SAVE MEDITATION"}</button>
                </div>
              )}
            </div>

            {/* CANNABIS */}
            <div className="section-card">
              <div className="section-header" onClick={()=>toggleSection("cannabis")}>
                <div className="section-title-row">
                  <div className="section-icon" style={{background:"rgba(16,185,129,0.12)"}}>🌿</div>
                  <div>
                    <div className="section-name" style={{color:"#10b981"}}>CANNABIS</div>
                    <div className="section-meta">
                      {cannabis.sessions?.length
                        ? `${cannabis.sessions.length} session${cannabis.sessions.length!==1?"s":""} · ${cannabis.sessions.reduce((t,s)=>t+(parseFloat(s.grams)||0),0).toFixed(2)}g total`
                        : "Not logged"}
                    </div>
                  </div>
                </div>
                <div className="section-toggle">{sections.cannabis?"−":"+"}</div>
              </div>
              {sections.cannabis && (
                <div className="section-body">
                  {/* Running total */}
                  {cannabis.sessions?.length>0 && (
                    <div className="total-bar">
                      <div><div className="total-label">TOTAL TODAY</div><div className="total-value">{cannabis.sessions.reduce((t,s)=>t+(parseFloat(s.grams)||0),0).toFixed(2)}<span style={{fontSize:12,color:"var(--text3)",marginLeft:4}}>g</span></div></div>
                      <div style={{textAlign:"right"}}>
                        <div className="total-label">SESSIONS</div>
                        <div style={{fontFamily:"var(--mono)",fontSize:20,fontWeight:700,color:"#10b981"}}>{cannabis.sessions.length}</div>
                      </div>
                    </div>
                  )}

                  {/* Session list */}
                  {cannabis.sessions?.length>0 && (
                    <div className="session-list">
                      {cannabis.sessions.map((s,i)=>(
                        <div className="session-item" key={i}>
                          <span className="session-method">#{i+1} · {s.method}</span>
                          <span className="session-grams">{s.grams}g</span>
                          <button className="set-del" onClick={()=>setCannabis(c=>({...c,sessions:c.sessions.filter((_,idx)=>idx!==i)}))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add session */}
                  <div className="add-session-row">
                    <div className="field">
                      <div className="field-label">Method</div>
                      <select value={newSession.method} onChange={e=>setNewSession({...newSession,method:e.target.value})}>
                        <option>Vape</option>
                        <option>Bong</option>
                      </select>
                    </div>
                    <div className="field">
                      <div className="field-label">Grams</div>
                      <input type="number" min="0" step="0.01" placeholder="0.25" value={newSession.grams} onChange={e=>setNewSession({...newSession,grams:e.target.value})}/>
                    </div>
                    <button className="add-set-btn" style={{marginBottom:1,padding:"8px 14px",fontSize:11}} onClick={()=>{
                      if(!newSession.grams) return;
                      setCannabis(c=>({...c,sessions:[...(c.sessions||[]),{method:newSession.method,grams:newSession.grams,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}]}));
                      setNewSession({method:newSession.method,grams:""});
                    }}>+ ADD</button>
                  </div>

                  <button className={`section-save-btn ${savedSection.cannabis?"saved":""}`} onClick={()=>handleSaveSection("cannabis")} disabled={savedSection.cannabis}>
                    {savedSection.cannabis?"✓ SAVED":"SAVE CANNABIS"}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: AI */}
          <div className="right-panel">
            <div className="ai-header"><div className="ai-dot"/><div className="ai-title">AI COACH</div></div>
            <button className="ai-analyze-btn" onClick={analyzeWithAI} disabled={aiLoading}>
              {aiLoading?<><span style={{display:"inline-block",animation:"pulse 1s infinite"}}>◉</span> ANALYZING...</>:"⚡ ANALYZE & OPTIMIZE"}
            </button>
            {!aiInsights&&!aiLoading && <div className="ai-card"><div className="ai-card-body loading">Log your data and click Analyze to get personalized AI coaching, pattern detection, and optimization tips.</div></div>}
            {aiInsights?.error && <div className="ai-card"><div className="ai-card-body" style={{color:"var(--accent5)"}}>{aiInsights.error}</div></div>}
            {aiInsights&&!aiInsights.error && <>
              <div className="ai-card">
                <div className="ai-card-header"><span style={{fontSize:14}}>🎯</span><span className="ai-card-title">AI READINESS ASSESSMENT</span><span className="tag" style={{marginLeft:"auto",background:"rgba(0,229,255,0.1)",color:"var(--accent)"}}>{aiInsights.readiness?.label}</span></div>
                <div className="ai-card-body">{aiInsights.readiness?.summary}</div>
              </div>
              <div className="ai-card">
                <div className="ai-card-header"><span style={{fontSize:14}}>💡</span><span className="ai-card-title">TODAY'S OPTIMIZATIONS</span></div>
                <div className="ai-card-body">
                  {aiInsights.tips?.map((t,i)=>(
                    <div className="tip-item" key={i}>
                      <span className="tip-icon">{t.icon}</span>
                      <div><div style={{fontSize:9,color:"var(--text3)",marginBottom:2,letterSpacing:"0.1em"}}>{t.category?.toUpperCase()}</div><span className="tip-text">{t.text}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ai-card"><div className="ai-card-header"><span style={{fontSize:14}}>📊</span><span className="ai-card-title">WEEKLY PATTERNS</span></div><div className="ai-card-body">{aiInsights.patterns}</div></div>
              <div className="ai-card"><div className="ai-card-header"><span style={{fontSize:14}}>→</span><span className="ai-card-title">TOMORROW'S FOCUS</span></div><div className="ai-card-body">{aiInsights.tomorrow}</div></div>
            </>}
            <div className="ai-card">
              <div className="ai-card-header"><span className="ai-card-title">STREAK TRACKER</span></div>
              <div className="ai-card-body">
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {icon:"💤",label:"SLEEP LOGGED",    count:Object.keys(history).filter(k=>history[k]?.sleep?.hours).length},
                    {icon:"⚖️",label:"WEIGHT LOGGED",   count:Object.keys(history).filter(k=>history[k]?.bodyweight?.value).length},
                    {icon:"🏋️",label:"WORKOUTS LOGGED", count:Object.keys(history).filter(k=>history[k]?.workout?.type).length},
                    {icon:"🧘",label:"MEDITATIONS",     count:Object.keys(history).filter(k=>history[k]?.meditation?.sessions?.length>0 || history[k]?.meditation?.duration).length},
                    {icon:"🌿",label:"CANNABIS LOGGED", count:Object.keys(history).filter(k=>history[k]?.cannabis?.sessions?.length>0).length},
                  ].map(s=>(
                    <div key={s.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span>{s.icon} <span style={{fontSize:10,color:"var(--text3)",letterSpacing:"0.05em"}}>{s.label}</span></span>
                      <span style={{fontFamily:"var(--mono)",fontSize:13,color:"var(--accent)",fontWeight:700}}>{s.count}d</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
