import { useState, useEffect, useCallback } from "react";
import { loadHistory, saveSection as saveSectionToDb } from "./supabase.js";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080c10;
    --surface: #0d1117;
    --surface2: #131920;
    --surface3: #1a2230;
    --border: #1e2d3d;
    --border2: #263547;
    --accent: #00e5ff;
    --accent2: #7c3aed;
    --accent3: #10b981;
    --accent4: #f59e0b;
    --accent5: #ef4444;
    --text: #e2e8f0;
    --text2: #94a3b8;
    --text3: #475569;
    --mono: 'Space Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; border-bottom: 1px solid var(--border);
    background: var(--surface); position: sticky; top: 0; z-index: 100;
  }
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

  .stars { display: flex; gap: 4px; }
  .star { font-size: 18px; cursor: pointer; transition: transform 0.1s; color: var(--border2); }
  .star:hover, .star.active { color: var(--accent4); transform: scale(1.1); }

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

  .history-view { padding: 24px; }
  .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; }
  .history-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
  .history-date { font-family: var(--mono); font-size: 11px; color: var(--accent); margin-bottom: 10px; }
  .history-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid var(--border); }
  .history-row:last-child { border: none; }
  .history-key { font-family: var(--mono); font-size: 10px; color: var(--text3); }
  .history-val { font-family: var(--mono); font-size: 10px; color: var(--text2); }

  .empty-state { text-align: center; padding: 40px; color: var(--text3); font-family: var(--mono); font-size: 12px; }
  .loading-state { display: flex; align-items: center; justify-content: center; min-height: 200px; font-family: var(--mono); font-size: 12px; color: var(--text3); }

  @media (max-width: 900px) {
    .main { grid-template-columns: 1fr; }
    .right-panel { border-top: 1px solid var(--border); }
  }
`;

const WORKOUT_SCHEDULE = [
  { day: "Monday", label: "Monday — Deadlift", key: "deadlift" },
  { day: "Tuesday", label: "Tuesday — Aesthetic", key: "aesthetic" },
  { day: "Wednesday", label: "Wednesday — Bench", key: "bench" },
  { day: "Thursday", label: "Thursday — Zone 2", key: "zone2_thu" },
  { day: "Friday", label: "Friday — Squat", key: "squat" },
  { day: "Saturday", label: "Saturday — Press", key: "press" },
  { day: "Sunday", label: "Sunday — Zone 2", key: "zone2_sun" },
];

const WORKOUT_EXERCISES = {
  deadlift: ["Trap Bar Deadlift", "Zercher Squats", "Seated Leg Curl", "FFE Split Squats", "Calf Raises", "Cable Twist"],
  aesthetic: ["Lateral Raises", "Rear Delt Flyes", "Tricep Extension", "Incline Curl", "Pullover", "Cable Curl", "Shrug", "Face Pulls"],
  bench: ["Bench Press", "Pull Up", "Incline Press", "Dumbbell Rows", "Chest Flyes", "Tricep Extension", "Cable Curl"],
  zone2_thu: [],
  squat: ["Zercher Squat", "Trap Bar Deadlift", "FFE Split Squat", "Seated Leg Curl", "Box Jump", "Calf Raises", "Cable Twist"],
  press: ["Overhead Press", "Pull Up", "Incline Press", "Dumbbell Rows", "Chest Flyes", "Lateral Raises", "Tricep Extension", "Incline Curl", "Rear Delt Flyes", "Shrugs", "Face Pull"],
  zone2_sun: [],
};

const ZONE2_DAYS = ["zone2_thu", "zone2_sun"];
const MEDITATION_STYLES = ["Mindfulness", "Breathwork", "Body Scan", "Visualization", "Loving-Kindness", "Transcendental", "Guided", "Unguided"];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getReadableDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function computeReadiness(data) {
  let scores = { sleep: 0, workout: 0, meditation: 0 };
  if (data.sleep?.hours) scores.sleep = Math.min(100, Math.round((parseFloat(data.sleep.hours) / 8) * 100));
  if (data.workout?.duration) scores.workout = Math.min(100, Math.round((parseInt(data.workout.duration) / 60) * 100));
  if (data.meditation?.duration) scores.meditation = Math.min(100, Math.round((parseInt(data.meditation.duration) / 20) * 100));
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 3);
  return { overall, ...scores };
}

export default function App() {
  const [view, setView] = useState("today");
  const [sections, setSections] = useState({ sleep: true, bodyweight: true, workout: true, meditation: true });
  const [bwUnit, setBwUnit] = useState(() => localStorage.getItem("bwUnit") || "lbs");
  const [history, setHistory] = useState({});
  const [dbLoading, setDbLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedSection, setSavedSection] = useState({});

  const [sleep, setSleep] = useState({ hours: "", quality: 0, notes: "" });
  const [bodyweight, setBodyweight] = useState({ value: "", notes: "" });
  const [workout, setWorkout] = useState({ type: "", duration: "", intensity: 5, notes: "", sets: {} });
  const [meditation, setMeditation] = useState({ duration: "", style: "", notes: "" });

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      setDbLoading(true);
      const hist = await loadHistory();
      setHistory(hist);
      const todayKey = getTodayKey();
      if (hist[todayKey]) {
        const d = hist[todayKey];
        if (d.sleep) setSleep(d.sleep);
        if (d.bodyweight) setBodyweight(d.bodyweight);
        if (d.workout) setWorkout(d.workout);
        if (d.meditation) setMeditation(d.meditation);
      }
      setDbLoading(false);
    }
    load();
  }, []);

  // Persist bwUnit to localStorage
  useEffect(() => { localStorage.setItem("bwUnit", bwUnit); }, [bwUnit]);

  const todayData = { sleep, workout, meditation, bodyweight };
  const readiness = computeReadiness(todayData);

  const handleSaveSection = useCallback(async (sectionName) => {
    const todayKey = getTodayKey();
    const sectionData = { sleep, workout, meditation, bodyweight }[sectionName];
    const success = await saveSectionToDb(todayKey, sectionName, sectionData);
    if (success) {
      setHistory(prev => ({
        ...prev,
        [todayKey]: { ...(prev[todayKey] || {}), [sectionName]: sectionData }
      }));
      setSavedSection(prev => ({ ...prev, [sectionName]: true }));
      setTimeout(() => setSavedSection(prev => ({ ...prev, [sectionName]: false })), 2000);
    }
  }, [sleep, workout, meditation, bodyweight]);

  const analyzeWithAI = useCallback(async () => {
    setAiLoading(true);
    setAiInsights(null);
    try {
      const histEntries = Object.entries(history).slice(-7).map(([date, data]) => ({ date, ...data }));
      const prompt = `You are a precision wellness coach analyzing biometric and lifestyle data. Be data-driven, specific, and actionable.

TODAY'S DATA (${getTodayKey()}):
- Sleep: ${sleep.hours}h, Quality: ${sleep.quality}/5 stars${sleep.notes ? `, Notes: ${sleep.notes}` : ""}
- Bodyweight: ${bodyweight.value ? `${bodyweight.value} ${bwUnit}` : "not logged"}${bodyweight.notes ? `, Notes: ${bodyweight.notes}` : ""}
- Workout: ${workout.type || "none"}, ${workout.duration}min, Intensity: ${workout.intensity}/10${workout.notes ? `, Notes: ${workout.notes}` : ""}
- Meditation: ${meditation.duration}min ${meditation.style}${meditation.notes ? `, Notes: ${meditation.notes}` : ""}

RECENT HISTORY (last ${histEntries.length} days):
${histEntries.map(e => `${e.date}: sleep ${e.sleep?.hours}h, bodyweight ${e.bodyweight?.value || "?"}${bwUnit}, workout ${e.workout?.type} ${e.workout?.duration}min, meditation ${e.meditation?.duration}min`).join("\n") || "No history yet"}

Respond ONLY with a JSON object (no markdown, no backticks) with this exact structure:
{
  "readiness": { "score": number, "label": "string (Optimal/Good/Moderate/Low/Rest Day)", "summary": "1-2 sentences on today's readiness" },
  "tips": [{ "icon": "emoji", "category": "string", "text": "specific actionable tip" }],
  "patterns": "2-3 sentences identifying patterns across the week",
  "tomorrow": "1-2 sentences on what to prioritize tomorrow based on data"
}
Generate 3-5 highly specific tips based on the actual data. Reference specific numbers.`;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setAiInsights(JSON.parse(clean));
    } catch (e) {
      setAiInsights({ error: "Analysis failed. Make sure you have data logged and try again." });
    }
    setAiLoading(false);
  }, [sleep, bodyweight, workout, meditation, history, bwUnit]);

  const toggleSection = (s) => setSections(prev => ({ ...prev, [s]: !prev[s] }));

  // Exercise set helpers
  const addSet = (exName) => {
    const current = workout.sets?.[exName] || [];
    setWorkout(w => ({ ...w, sets: { ...w.sets, [exName]: [...current, { reps: "", weight: "" }] } }));
  };
  const updateSet = (exName, idx, field, val) => {
    const current = [...(workout.sets?.[exName] || [])];
    current[idx] = { ...current[idx], [field]: val };
    setWorkout(w => ({ ...w, sets: { ...w.sets, [exName]: current } }));
  };
  const removeSet = (exName, idx) => {
    const current = [...(workout.sets?.[exName] || [])];
    current.splice(idx, 1);
    setWorkout(w => ({ ...w, sets: { ...w.sets, [exName]: current } }));
  };

  const selectedSchedule = WORKOUT_SCHEDULE.find(w => w.label === workout.type);
  const exercises = selectedSchedule ? (WORKOUT_EXERCISES[selectedSchedule.key] || []) : [];
  const isZone2 = selectedSchedule ? ZONE2_DAYS.includes(selectedSchedule.key) : false;

  // Bodyweight sparkline
  const bwHistory = Object.entries(history)
    .filter(([, d]) => d.bodyweight?.value)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([, d]) => parseFloat(d.bodyweight.value));
  const bwTodayVal = parseFloat(bodyweight.value) || null;
  const sparkPoints = [...bwHistory, ...(bwTodayVal ? [bwTodayVal] : [])];
  const bwAllVals = sparkPoints;
  const bwMin = bwAllVals.length ? Math.min(...bwAllVals) - 2 : 0;
  const bwMax = bwAllVals.length ? Math.max(...bwAllVals) + 2 : 100;
  const bwRange = bwMax - bwMin || 1;
  const lastHistBw = bwHistory.length ? bwHistory[bwHistory.length - 1] : null;
  const bwDelta = bwTodayVal && lastHistBw ? (bwTodayVal - lastHistBw).toFixed(1) : null;

  function buildSparkPath(points) {
    if (!points.length) return "";
    const w = 300, h = 40;
    const step = w / Math.max(points.length - 1, 1);
    return points.map((p, i) => {
      const x = (i * step).toFixed(1);
      const y = (h - ((p - bwMin) / bwRange) * h).toFixed(1);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }
  const sparkPath = buildSparkPath(sparkPoints);

  const readinessColor = readiness.overall >= 80 ? "#10b981" : readiness.overall >= 60 ? "#00e5ff" : readiness.overall >= 40 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference - (readiness.overall / 100) * circumference;

  if (dbLoading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="app">
          <header className="header">
            <div className="logo">SOMA<span>/</span>TRACK</div>
          </header>
          <div className="loading-state">Loading your data...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <header className="header">
          <div className="logo">SOMA<span>/</span>TRACK</div>
          <div className="nav">
            <button className={`nav-btn ${view === "today" ? "active" : ""}`} onClick={() => setView("today")}>TODAY</button>
            <button className={`nav-btn ${view === "history" ? "active" : ""}`} onClick={() => setView("history")}>HISTORY</button>
          </div>
          <div className="date-pill">{getReadableDate()}</div>
        </header>

        {view === "history" ? (
          <div className="history-view">
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>PAST ENTRIES</div>
            {Object.keys(history).length === 0 ? (
              <div className="empty-state">No history yet. Save your first entry to see it here.</div>
            ) : (
              <div className="history-grid">
                {Object.entries(history).sort((a, b) => b[0].localeCompare(a[0])).map(([date, d]) => {
                  const r = computeReadiness(d);
                  return (
                    <div className="history-card" key={date}>
                      <div className="history-date">{date} — Readiness: {r.overall}%</div>
                      {d.sleep?.hours && <div className="history-row"><span className="history-key">💤 Sleep</span><span className="history-val">{d.sleep.hours}h · ⭐{d.sleep.quality}/5</span></div>}
                      {d.bodyweight?.value && <div className="history-row"><span className="history-key">⚖️ Weight</span><span className="history-val">{d.bodyweight.value} {bwUnit}</span></div>}
                      {d.workout?.type && <div className="history-row"><span className="history-key">🏋️ Workout</span><span className="history-val">{d.workout.type.split("—")[1]?.trim()} · {d.workout.duration}min</span></div>}
                      {d.meditation?.duration && <div className="history-row"><span className="history-key">🧘 Meditation</span><span className="history-val">{d.meditation.duration}min · {d.meditation.style}</span></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="main">
            <div className="left-panel">

              {/* READINESS */}
              <div className="readiness-card">
                <div className="score-ring">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface3)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke={readinessColor} strokeWidth="6"
                      strokeDasharray={circumference} strokeDashoffset={dashOffset}
                      strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                  </svg>
                  <div className="score-val">
                    <div className="num" style={{ color: readinessColor }}>{readiness.overall}</div>
                    <div className="lbl">READY</div>
                  </div>
                </div>
                <div className="readiness-info">
                  <div className="readiness-title">DAILY READINESS</div>
                  <div className="readiness-bars">
                    {[
                      { lbl: "SLEEP", val: readiness.sleep, color: "var(--accent2)" },
                      { lbl: "TRAINING", val: readiness.workout, color: "var(--accent5)" },
                      { lbl: "MINDFULNESS", val: readiness.meditation, color: "var(--accent3)" },
                    ].map(b => (
                      <div className="r-bar" key={b.lbl}>
                        <span style={{ width: 80 }}>{b.lbl}</span>
                        <div className="r-bar-track"><div className="r-bar-fill" style={{ width: `${b.val}%`, background: b.color }} /></div>
                        <span style={{ width: 26, textAlign: "right", color: "var(--text2)" }}>{b.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SLEEP */}
              <div className="section-card">
                <div className="section-header" onClick={() => toggleSection("sleep")}>
                  <div className="section-title-row">
                    <div className="section-icon" style={{ background: "rgba(124,58,237,0.15)" }}>💤</div>
                    <div>
                      <div className="section-name" style={{ color: "#a78bfa" }}>SLEEP</div>
                      <div className="section-meta">{sleep.hours ? `${sleep.hours}h · ⭐ ${sleep.quality}/5` : "Not logged"}</div>
                    </div>
                  </div>
                  <div className="section-toggle">{sections.sleep ? "−" : "+"}</div>
                </div>
                {sections.sleep && (
                  <div className="section-body">
                    <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="field">
                        <div className="field-label">Hours Slept</div>
                        <input type="number" min="0" max="24" step="0.5" placeholder="7.5" value={sleep.hours} onChange={e => setSleep({ ...sleep, hours: e.target.value })} />
                      </div>
                      <div className="field">
                        <div className="field-label">Quality</div>
                        <div className="stars">
                          {[1,2,3,4,5].map(n => (
                            <span key={n} className={`star ${sleep.quality >= n ? "active" : ""}`} onClick={() => setSleep({ ...sleep, quality: n })}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Notes</div>
                      <textarea placeholder="Dream quality, woke up times, sleep window..." value={sleep.notes} onChange={e => setSleep({ ...sleep, notes: e.target.value })} />
                    </div>
                    <button className={`section-save-btn ${savedSection.sleep ? "saved" : ""}`} onClick={() => handleSaveSection("sleep")} disabled={savedSection.sleep}>
                      {savedSection.sleep ? "✓ SAVED" : "SAVE SLEEP"}
                    </button>
                  </div>
                )}
              </div>

              {/* BODYWEIGHT */}
              <div className="section-card">
                <div className="section-header" onClick={() => toggleSection("bodyweight")}>
                  <div className="section-title-row">
                    <div className="section-icon" style={{ background: "rgba(232,121,249,0.15)" }}>⚖️</div>
                    <div>
                      <div className="section-name" style={{ color: "#e879f9" }}>BODYWEIGHT</div>
                      <div className="section-meta">{bodyweight.value ? `${bodyweight.value} ${bwUnit}${bwDelta ? ` · ${parseFloat(bwDelta) > 0 ? "+" : ""}${bwDelta} from prev` : ""}` : "Not logged"}</div>
                    </div>
                  </div>
                  <div className="section-toggle">{sections.bodyweight ? "−" : "+"}</div>
                </div>
                {sections.bodyweight && (
                  <div className="section-body">
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div className="bw-display">
                        <div className="bw-num">{bodyweight.value || "—"}</div>
                        <div className="bw-unit-lbl">{bwUnit}</div>
                        {bwDelta !== null && (
                          <div className={`bw-delta ${parseFloat(bwDelta) > 0 ? "up" : parseFloat(bwDelta) < 0 ? "down" : "same"}`}>
                            {parseFloat(bwDelta) > 0 ? "▲" : parseFloat(bwDelta) < 0 ? "▼" : "="} {Math.abs(bwDelta)}
                          </div>
                        )}
                      </div>
                      <div className="unit-toggle">
                        {["lbs", "kg"].map(u => (
                          <button key={u} className={`unit-btn ${bwUnit === u ? "active" : ""}`} onClick={() => setBwUnit(u)}>{u}</button>
                        ))}
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Weight ({bwUnit})</div>
                      <input type="number" step="0.1" min="0" placeholder={bwUnit === "lbs" ? "175.0" : "79.4"} value={bodyweight.value} onChange={e => setBodyweight({ ...bodyweight, value: e.target.value })} />
                    </div>
                    {sparkPoints.length > 1 && (
                      <div>
                        <div className="field-label" style={{ marginBottom: 6 }}>14-DAY TREND</div>
                        <svg className="bw-sparkline" viewBox="0 0 300 40" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e879f9" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={`${sparkPath} L ${((sparkPoints.length-1)*300/Math.max(sparkPoints.length-1,1)).toFixed(1)} 40 L 0 40 Z`} fill="url(#bwGrad)" />
                          <path d={sparkPath} fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          {sparkPoints.map((p, i) => {
                            const x = (i * 300 / Math.max(sparkPoints.length - 1, 1)).toFixed(1);
                            const y = (40 - ((p - bwMin) / bwRange) * 40).toFixed(1);
                            return <circle key={i} cx={x} cy={y} r={i === sparkPoints.length-1 ? "3" : "2"} fill={i === sparkPoints.length-1 ? "#e879f9" : "#7c3aed"} />;
                          })}
                        </svg>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
                          <span>{Math.min(...bwAllVals).toFixed(1)} {bwUnit}</span>
                          <span style={{ color: "var(--text2)" }}>LOW → HIGH</span>
                          <span>{Math.max(...bwAllVals).toFixed(1)} {bwUnit}</span>
                        </div>
                      </div>
                    )}
                    <div className="field">
                      <div className="field-label">Notes</div>
                      <textarea placeholder="Morning weight, post-workout, water retention notes..." value={bodyweight.notes} onChange={e => setBodyweight({ ...bodyweight, notes: e.target.value })} />
                    </div>
                    <button className={`section-save-btn ${savedSection.bodyweight ? "saved" : ""}`} onClick={() => handleSaveSection("bodyweight")} disabled={savedSection.bodyweight}>
                      {savedSection.bodyweight ? "✓ SAVED" : "SAVE WEIGHT"}
                    </button>
                  </div>
                )}
              </div>

              {/* WORKOUT */}
              <div className="section-card">
                <div className="section-header" onClick={() => toggleSection("workout")}>
                  <div className="section-title-row">
                    <div className="section-icon" style={{ background: "rgba(239,68,68,0.15)" }}>🏋️</div>
                    <div>
                      <div className="section-name" style={{ color: "#f87171" }}>WORKOUT</div>
                      <div className="section-meta">
                        {workout.type ? `${workout.type.split("—")[1]?.trim() || workout.type} · ${workout.duration || 0}min${!isZone2 && exercises.length ? ` · ${exercises.filter(e => (workout.sets?.[e] || []).length > 0).length}/${exercises.length} exercises` : ""}` : "Not logged"}
                      </div>
                    </div>
                  </div>
                  <div className="section-toggle">{sections.workout ? "−" : "+"}</div>
                </div>
                {sections.workout && (
                  <div className="section-body">
                    <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="field">
                        <div className="field-label">Workout</div>
                        <select value={workout.type} onChange={e => setWorkout({ ...workout, type: e.target.value, sets: {} })}>
                          <option value="">Select day</option>
                          {WORKOUT_SCHEDULE.map(w => <option key={w.key} value={w.label}>{w.label}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <div className="field-label">Duration (min)</div>
                        <input type="number" min="0" placeholder="60" value={workout.duration} onChange={e => setWorkout({ ...workout, duration: e.target.value })} />
                      </div>
                    </div>

                    {isZone2 && (
                      <div className="zone2-fields">
                        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em" }}>ZONE 2 CARDIO</div>
                        <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                          <div className="field">
                            <div className="field-label">Modality</div>
                            <select value={workout.modality || ""} onChange={e => setWorkout({ ...workout, modality: e.target.value, resistance: "" })}>
                              <option value="">Select</option>
                              <option>Treadmill</option>
                              <option>Heavy Bag</option>
                            </select>
                          </div>
                          <div className="field">
                            <div className="field-label">Avg HR (bpm)</div>
                            <input type="number" placeholder="135" value={workout.avgHr || ""} onChange={e => setWorkout({ ...workout, avgHr: e.target.value })} />
                          </div>
                        </div>
                        <div className="field-row" style={{ gridTemplateColumns: workout.modality === "Treadmill" ? "1fr 1fr" : "1fr" }}>
                          <div className="field">
                            <div className="field-label">Distance (mi)</div>
                            <input type="number" step="0.1" placeholder="3.0" value={workout.distance || ""} onChange={e => setWorkout({ ...workout, distance: e.target.value })} />
                          </div>
                          {workout.modality === "Treadmill" && (
                            <div className="field">
                              <div className="field-label">Incline (%)</div>
                              <input type="number" min="0" max="15" step="0.5" placeholder="2.0" value={workout.resistance || ""} onChange={e => setWorkout({ ...workout, resistance: e.target.value })} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!isZone2 && exercises.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Exercises</div>
                        {exercises.map(exName => {
                          const sets = workout.sets?.[exName] || [];
                          const bestSet = sets.reduce((b, s) => (parseFloat(s.weight) > parseFloat(b.weight || 0) ? s : b), {});
                          return (
                            <div className="exercise-block" key={exName}>
                              <div className="exercise-name-row">
                                <span className="exercise-name">{exName}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  {sets.length > 0 && (
                                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)" }}>
                                      {sets.length} set{sets.length !== 1 ? "s" : ""}{bestSet.weight ? ` · top ${bestSet.weight}lbs` : ""}
                                    </span>
                                  )}
                                  <button className="add-set-btn" onClick={() => addSet(exName)}>+ SET</button>
                                </div>
                              </div>
                              {sets.length > 0 ? (
                                <div>
                                  <div className="set-header">
                                    <div className="set-col-label">SET</div>
                                    <div className="set-col-label">WEIGHT (lbs)</div>
                                    <div className="set-col-label">REPS</div>
                                    <div />
                                  </div>
                                  {sets.map((set, idx) => (
                                    <div className="set-row" key={idx}>
                                      <div className="set-num">{idx + 1}</div>
                                      <input className="set-input" type="number" min="0" step="2.5" placeholder="135" value={set.weight} onChange={e => updateSet(exName, idx, "weight", e.target.value)} />
                                      <input className="set-input" type="number" min="0" placeholder="8" value={set.reps} onChange={e => updateSet(exName, idx, "reps", e.target.value)} />
                                      <button className="set-del" onClick={() => removeSet(exName, idx)}>✕</button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ padding: "8px 12px", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>No sets logged — tap + SET to begin</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isZone2 && workout.type && exercises.length === 0 && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>Exercise list coming soon.</div>
                    )}

                    <div className="field">
                      <div className="field-label">Intensity — {workout.intensity}/10</div>
                      <div className="intensity-row">
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>LOW</span>
                        <input type="range" className="intensity-slider" min="1" max="10" value={workout.intensity} onChange={e => setWorkout({ ...workout, intensity: parseInt(e.target.value) })} />
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>MAX</span>
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Notes</div>
                      <textarea placeholder="How you felt, PRs, anything notable..." value={workout.notes} onChange={e => setWorkout({ ...workout, notes: e.target.value })} />
                    </div>
                    <button className={`section-save-btn ${savedSection.workout ? "saved" : ""}`} onClick={() => handleSaveSection("workout")} disabled={savedSection.workout}>
                      {savedSection.workout ? "✓ SAVED" : "SAVE WORKOUT"}
                    </button>
                  </div>
                )}
              </div>

              {/* MEDITATION */}
              <div className="section-card">
                <div className="section-header" onClick={() => toggleSection("meditation")}>
                  <div className="section-title-row">
                    <div className="section-icon" style={{ background: "rgba(16,185,129,0.15)" }}>🧘</div>
                    <div>
                      <div className="section-name" style={{ color: "#34d399" }}>MEDITATION</div>
                      <div className="section-meta">{meditation.duration ? `${meditation.duration}min · ${meditation.style || "—"}` : "Not logged"}</div>
                    </div>
                  </div>
                  <div className="section-toggle">{sections.meditation ? "−" : "+"}</div>
                </div>
                {sections.meditation && (
                  <div className="section-body">
                    <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="field">
                        <div className="field-label">Duration (min)</div>
                        <input type="number" min="0" placeholder="20" value={meditation.duration} onChange={e => setMeditation({ ...meditation, duration: e.target.value })} />
                      </div>
                      <div className="field">
                        <div className="field-label">Style</div>
                        <select value={meditation.style} onChange={e => setMeditation({ ...meditation, style: e.target.value })}>
                          <option value="">Select style</option>
                          {MEDITATION_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Notes</div>
                      <textarea placeholder="Mental state, focus level, insights..." value={meditation.notes} onChange={e => setMeditation({ ...meditation, notes: e.target.value })} />
                    </div>
                    <button className={`section-save-btn ${savedSection.meditation ? "saved" : ""}`} onClick={() => handleSaveSection("meditation")} disabled={savedSection.meditation}>
                      {savedSection.meditation ? "✓ SAVED" : "SAVE MEDITATION"}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT: AI PANEL */}
            <div className="right-panel">
              <div className="ai-header">
                <div className="ai-dot" />
                <div className="ai-title">AI COACH</div>
              </div>

              <button className="ai-analyze-btn" onClick={analyzeWithAI} disabled={aiLoading}>
                {aiLoading ? <><span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>◉</span> ANALYZING...</> : "⚡ ANALYZE & OPTIMIZE"}
              </button>

              {!aiInsights && !aiLoading && (
                <div className="ai-card">
                  <div className="ai-card-body loading">Log your data and click Analyze to get personalized AI coaching, pattern detection, and optimization tips.</div>
                </div>
              )}

              {aiInsights?.error && (
                <div className="ai-card">
                  <div className="ai-card-body" style={{ color: "var(--accent5)" }}>{aiInsights.error}</div>
                </div>
              )}

              {aiInsights && !aiInsights.error && (
                <>
                  <div className="ai-card">
                    <div className="ai-card-header">
                      <span style={{ fontSize: 14 }}>🎯</span>
                      <span className="ai-card-title">AI READINESS ASSESSMENT</span>
                      <span className="tag" style={{ marginLeft: "auto", background: "rgba(0,229,255,0.1)", color: "var(--accent)" }}>{aiInsights.readiness?.label}</span>
                    </div>
                    <div className="ai-card-body">{aiInsights.readiness?.summary}</div>
                  </div>
                  <div className="ai-card">
                    <div className="ai-card-header"><span style={{ fontSize: 14 }}>💡</span><span className="ai-card-title">TODAY'S OPTIMIZATIONS</span></div>
                    <div className="ai-card-body">
                      {aiInsights.tips?.map((t, i) => (
                        <div className="tip-item" key={i}>
                          <span className="tip-icon">{t.icon}</span>
                          <div>
                            <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 2, letterSpacing: "0.1em" }}>{t.category?.toUpperCase()}</div>
                            <span className="tip-text">{t.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ai-card">
                    <div className="ai-card-header"><span style={{ fontSize: 14 }}>📊</span><span className="ai-card-title">WEEKLY PATTERNS</span></div>
                    <div className="ai-card-body">{aiInsights.patterns}</div>
                  </div>
                  <div className="ai-card">
                    <div className="ai-card-header"><span style={{ fontSize: 14 }}>→</span><span className="ai-card-title">TOMORROW'S FOCUS</span></div>
                    <div className="ai-card-body">{aiInsights.tomorrow}</div>
                  </div>
                </>
              )}

              <div className="ai-card">
                <div className="ai-card-header"><span className="ai-card-title">STREAK TRACKER</span></div>
                <div className="ai-card-body">
                  {(() => {
                    const keys = Object.keys(history).sort();
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          { icon: "💤", label: "SLEEP LOGGED", count: keys.filter(k => history[k]?.sleep?.hours).length },
                          { icon: "⚖️", label: "WEIGHT LOGGED", count: keys.filter(k => history[k]?.bodyweight?.value).length },
                          { icon: "🏋️", label: "WORKOUTS LOGGED", count: keys.filter(k => history[k]?.workout?.type).length },
                          { icon: "🧘", label: "MEDITATIONS LOGGED", count: keys.filter(k => history[k]?.meditation?.duration).length },
                        ].map(s => (
                          <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span>{s.icon} <span style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.05em" }}>{s.label}</span></span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{s.count}d</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
