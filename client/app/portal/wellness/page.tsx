"use client";

import { useState, useEffect, useRef, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { apiRequest } from "@/lib/api";
import { Flame, CheckCircle2, Circle, Activity, AlertTriangle, Phone, CalendarDays, RotateCcw, Heart, Sun, Moon, Sparkle, Zap, Snowflake, Droplet, Frown } from "lucide-react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface DayLog {
  date: string; // YYYY-MM-DD
  morningBrush: boolean;
  nightBrush: boolean;
  floss: boolean;
}

interface WellnessState {
  logs: DayLog[];
  streak: number;
  longestStreak: number;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(userId: string) {
  return `hollyhill_wellness_${userId}`;
}

function loadState(userId: string): WellnessState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { logs: [], streak: 0, longestStreak: 0 };
}

function saveState(userId: string, state: WellnessState) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {}
}

function computeStreak(logs: DayLog[]): number {
  const today = todayKey();
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const log = logs.find((l) => l.date === key);
    const complete = log && log.morningBrush && log.nightBrush && log.floss;
    if (key === today && !complete) {
      // today not yet complete — don't break streak from yesterday
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!complete) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ─────────────────────────────────────────────
   CONFETTI CANVAS
───────────────────────────────────────────── */
function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const COLORS = ["#C9A84C", "#1B2B5E", "#34D399", "#F59E0B", "#EC4899", "#60A5FA"];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1,
      r: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 120);
        if (p.shape === "rect") {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.05;
      });
      frame++;
      if (frame < 140) animRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-20 rounded-2xl"
    />
  );
}

/* ─────────────────────────────────────────────
   SVG PROGRESS RING
───────────────────────────────────────────── */
function ProgressRing({
  value, max, size = 80, stroke = 7, color = "#C9A84C", label, sublabel,
}: {
  value: number; max: number; size?: number; stroke?: number;
  color?: string; label: string; sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="text-xs font-bold text-navy -mt-1">{label}</span>
      {sublabel && <span className="text-[10px] text-gray-400">{sublabel}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HABIT TRACKER
───────────────────────────────────────────── */
function HabitTracker({ userId }: { userId: string }) {
  const [state, setState] = useState<WellnessState>(() => loadState(userId));
  const [confetti, setConfetti] = useState(false);
  const prevComplete = useRef(false);

  // Sync state if userId loads asynchronously or storage updates on another tab
  useEffect(() => {
    setState(loadState(userId));

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey(userId)) {
        setState(loadState(userId));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [userId]);

  const today = todayKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todayLog: DayLog = state.logs.find((l) => l.date === today) || {
    date: today, morningBrush: false, nightBrush: false, floss: false,
  };

  const todayComplete = todayLog.morningBrush && todayLog.nightBrush && todayLog.floss;
  const todayScore = [todayLog.morningBrush, todayLog.nightBrush, todayLog.floss].filter(Boolean).length;

  const toggle = useCallback((field: keyof Omit<DayLog, "date">) => {
    setState((prev) => {
      const logs = prev.logs.filter((l) => l.date !== today);
      const updated: DayLog = { ...todayLog, [field]: !todayLog[field] };
      const newLogs = [...logs, updated];
      const streak = computeStreak(newLogs);
      const longestStreak = Math.max(prev.longestStreak, streak);
      const next = { logs: newLogs, streak, longestStreak };
      saveState(userId, next);
      // Sync to backend (fire-and-forget)
      apiRequest("/wellness/sync", {
        method: "POST",
        body: JSON.stringify({
          date: today,
          morningBrush: updated.morningBrush,
          nightBrush: updated.nightBrush,
          floss: updated.floss,
          streak,
          longestStreak,
        }),
      }).catch(() => {});
      return next;
    });
  }, [today, todayLog, userId]);

  // Fire confetti when all 3 habits completed
  useEffect(() => {
    if (todayComplete && !prevComplete.current) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2500);
    }
    prevComplete.current = todayComplete;
  }, [todayComplete]);

  // Last 7 days for mini calendar
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const log = state.logs.find((l) => l.date === key);
    const done = log && log.morningBrush && log.nightBrush && log.floss;
    const partial = log && (log.morningBrush || log.nightBrush || log.floss) && !done;
    return { key, day: d.toLocaleDateString("en-IE", { weekday: "short" }).slice(0, 1), done, partial };
  });

  const streakMilestone = state.streak >= 30 ? "🏆 30-Day Champion!" : state.streak >= 14 ? "🥇 14-Day Streak!" : state.streak >= 7 ? "⭐ 7-Day Streak!" : null;

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
      <ConfettiCanvas active={confetti} />

      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-base font-bold text-navy flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Daily Oral Care Streak
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Log your habits every day to build your streak</p>
        </div>
        {streakMilestone && (
          <span className="text-[10px] font-bold bg-gold/10 text-gold px-2.5 py-1 rounded-full animate-pulse">
            {streakMilestone}
          </span>
        )}
      </div>

      {/* Progress rings */}
      <div className="flex items-center justify-around py-2">
        <ProgressRing value={todayScore} max={3} size={88} label="Today" sublabel={`${todayScore}/3`} />
        <ProgressRing value={state.streak} max={Math.max(state.streak, 7)} size={88} color="#1B2B5E" label="Streak" sublabel={`${state.streak} days`} />
        <ProgressRing value={state.longestStreak} max={Math.max(state.longestStreak, 30)} size={88} color="#34D399" label="Best" sublabel={`${state.longestStreak} days`} />
      </div>

      {/* Habit toggles */}
      <div className="space-y-3">
        {([
          { key: "morningBrush", label: "Morning Brush", icon: <Sun className="w-6 h-6 text-amber-500" />, desc: "2 min fluoride brush" },
          { key: "nightBrush", label: "Night Brush", icon: <Moon className="w-6 h-6 text-indigo-500" />, desc: "2 min before bed" },
          { key: "floss", label: "Floss", icon: <Sparkle className="w-6 h-6 text-sky-400" />, desc: "Clean between teeth" },
        ] as const).map(({ key, label, icon, desc }) => {
          const done = todayLog[key];
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                done
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gray-100 bg-gray-50 hover:border-gold/40"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8">{icon}</div>
              <div className="flex-1">
                <span className={`block text-xs font-bold ${done ? "text-emerald-700" : "text-navy"}`}>{label}</span>
                <span className="block text-[10px] text-gray-400">{desc}</span>
              </div>
              {done
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                : <Circle className="w-5 h-5 text-gray-300 shrink-0" />
              }
            </button>
          );
        })}
      </div>

      {todayComplete && (
        <div className="bg-linear-to-r from-gold/10 to-emerald-50 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <Activity className="w-5 h-5 text-gold shrink-0" />
          <div>
            <span className="block text-xs font-bold text-navy">All habits complete for today! 🎉</span>
            <span className="block text-[10px] text-gray-500">Your teeth will thank you. Keep the streak going tomorrow.</span>
          </div>
        </div>
      )}

      {/* 7-day mini calendar */}
      <div>
        <p className="text-[10px] font-bold text-navy uppercase tracking-wider mb-2">Last 7 Days</p>
        <div className="flex gap-1.5">
          {last7.map(({ key, day, done, partial }) => (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-gray-400 font-semibold">{day}</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                done ? "bg-emerald-500 border-emerald-500 text-white" :
                partial ? "bg-amber-100 border-amber-300 text-amber-600" :
                "bg-gray-100 border-gray-200 text-gray-400"
              }`}>
                {done ? "✓" : partial ? "~" : "·"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SYMPTOM CHECKER WIZARD
───────────────────────────────────────────── */
type Urgency = "green" | "amber" | "red";

interface Concern {
  id: string;
  label: string;
  icon: JSX.Element;
  questions: { id: string; text: string }[];
  urgency: (answers: Record<string, boolean>) => Urgency;
  advice: (answers: Record<string, boolean>) => string;
}

const CONCERNS: Concern[] = [
  {
    id: "toothache",
    label: "Severe Toothache",
    icon: <Zap className="w-7 h-7 text-amber-500" />,
    questions: [
      { id: "q1", text: "Is the pain constant (not just when eating)?" },
      { id: "q2", text: "Is there swelling in your face or jaw?" },
      { id: "q3", text: "Do you have a fever or feel unwell?" },
    ],
    urgency: (a) => (a.q2 || a.q3) ? "red" : a.q1 ? "amber" : "green",
    advice: (a) =>
      (a.q2 || a.q3)
        ? "Facial swelling with toothache can indicate a dental abscess — a serious infection. Call the clinic immediately or go to A&E."
        : a.q1
        ? "Constant pain suggests nerve involvement. Schedule an urgent appointment within 24–48 hours."
        : "Intermittent pain may be sensitivity or a minor issue. Book a routine check-up soon.",
  },
  {
    id: "sensitivity",
    label: "Sensitive Teeth",
    icon: <Snowflake className="w-7 h-7 text-sky-400" />,
    questions: [
      { id: "q1", text: "Does it hurt with hot AND cold?" },
      { id: "q2", text: "Is the pain sharp and lingering (>30 seconds)?" },
      { id: "q3", text: "Have you noticed any visible cracks or chips?" },
    ],
    urgency: (a) => a.q2 ? "amber" : a.q1 || a.q3 ? "amber" : "green",
    advice: (a) =>
      a.q2
        ? "Lingering pain to temperature may indicate pulpitis (nerve inflammation). Book an appointment soon."
        : "Use a sensitivity toothpaste (e.g. Sensodyne) and avoid acidic foods. Book a check-up if it persists.",
  },
  {
    id: "bleeding",
    label: "Bleeding Gums",
    icon: <Droplet className="w-7 h-7 text-red-400" />,
    questions: [
      { id: "q1", text: "Do your gums bleed every time you brush?" },
      { id: "q2", text: "Are your gums swollen, red or receding?" },
      { id: "q3", text: "Do you have bad breath that won't go away?" },
    ],
    urgency: (a) => (a.q1 && a.q2) ? "amber" : "green",
    advice: (a) =>
      (a.q1 && a.q2)
        ? "These are signs of gingivitis or early periodontitis. Book a hygiene appointment for a professional clean."
        : "Occasional bleeding can be from brushing too hard. Use a soft brush and improve flossing. Monitor for 2 weeks.",
  },
  {
    id: "chipped",
    label: "Chipped / Broken Tooth",
    icon: <Activity className="w-7 h-7 text-slate-500" />,
    questions: [
      { id: "q1", text: "Is there sharp pain when biting?" },
      { id: "q2", text: "Is the chip large or is the tooth visibly broken?" },
      { id: "q3", text: "Did you lose a filling or crown?" },
    ],
    urgency: (a) => a.q1 ? "amber" : a.q2 || a.q3 ? "amber" : "green",
    advice: (a) =>
      a.q1
        ? "Pain on biting suggests the crack may extend to the nerve. Book an urgent appointment."
        : a.q2 || a.q3
        ? "A large chip or lost restoration needs prompt attention to prevent further damage. Book within a few days."
        : "A small chip without pain can wait for a routine appointment. Avoid hard foods on that side.",
  },
  {
    id: "swelling",
    label: "Facial Swelling",
    icon: <Frown className="w-7 h-7 text-orange-400" />,
    questions: [
      { id: "q1", text: "Did the swelling appear suddenly (within hours)?" },
      { id: "q2", text: "Do you have difficulty swallowing or breathing?" },
      { id: "q3", text: "Do you have a fever?" },
    ],
    urgency: (a) => (a.q2) ? "red" : (a.q1 || a.q3) ? "red" : "amber",
    advice: (a) =>
      a.q2
        ? "Difficulty swallowing or breathing with swelling is a medical emergency. Call 999 immediately."
        : "Facial swelling is often a dental abscess. This requires urgent treatment — call the clinic now or go to A&E.",
  },
  {
    id: "lost-tooth",
    label: "Knocked-Out Tooth",
    icon: <AlertTriangle className="w-7 h-7 text-red-500" />,
    questions: [
      { id: "q1", text: "Did it happen within the last hour?" },
      { id: "q2", text: "Is it an adult (permanent) tooth?" },
    ],
    urgency: () => "red",
    advice: (a) =>
      a.q1 && a.q2
        ? "Act fast! Keep the tooth moist (in milk or between cheek and gum). Call the clinic immediately — re-implantation is possible within 1 hour."
        : "Call the clinic immediately. Even if re-implantation isn't possible, urgent care is needed.",
  },
];

const URGENCY_CONFIG = {
  green: {
    label: "Gentle Care",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    cta: "Book a Routine Check-up",
  },
  amber: {
    label: "Schedule a Clinic Visit",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    cta: "Request an Appointment",
  },
  red: {
    label: "Urgent — Call Clinic Now",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    icon: <Phone className="w-5 h-5 text-red-500" />,
    cta: "Call +353 21 430 3072",
  },
};

function SymptomChecker() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "questions" | "result">("select");
  const [selected, setSelected] = useState<Concern | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [qIdx, setQIdx] = useState(0);

  const reset = () => {
    setStep("select");
    setSelected(null);
    setAnswers({});
    setQIdx(0);
  };

  const pickConcern = (c: Concern) => {
    setSelected(c);
    setAnswers({});
    setQIdx(0);
    setStep("questions");
  };

  const answerQuestion = (val: boolean) => {
    if (!selected) return;
    const qId = selected.questions[qIdx].id;
    const newAnswers = { ...answers, [qId]: val };
    setAnswers(newAnswers);
    if (qIdx + 1 < selected.questions.length) {
      setQIdx(qIdx + 1);
    } else {
      setStep("result");
    }
  };

  const urgency = selected ? selected.urgency(answers) : "green";
  const advice = selected ? selected.advice(answers) : "";
  const cfg = URGENCY_CONFIG[urgency];

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-base font-bold text-navy flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" /> Smart Symptom Checker
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Answer a few questions to understand your dental concern</p>
        </div>
        {step !== "select" && (
          <button onClick={reset} className="text-[10px] text-gray-400 hover:text-navy flex items-center gap-1 transition-colors">
            <RotateCcw className="w-3 h-3" /> Start over
          </button>
        )}
      </div>

      {/* Step 1: Select concern */}
      {step === "select" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONCERNS.map((c) => (
            <button
              key={c.id}
              onClick={() => pickConcern(c)}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-xl hover:border-gold hover:bg-gold/5 transition-all text-center group"
            >
              <div className="flex items-center justify-center w-10 h-10 mb-1">{c.icon}</div>
              <span className="text-[11px] font-bold text-navy group-hover:text-gold transition-colors leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Questions */}
      {step === "questions" && selected && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-8 h-8">{selected.icon}</div>
            <span className="font-serif text-sm font-bold text-navy">{selected.label}</span>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {selected.questions.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= qIdx ? "bg-gold" : "bg-gray-100"}`} />
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-navy leading-relaxed">
              {selected.questions[qIdx].text}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => answerQuestion(true)}
                className="flex-1 bg-navy text-white font-bold py-3 rounded-xl text-xs hover:bg-gray-800 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => answerQuestion(false)}
                className="flex-1 border-2 border-gray-200 text-navy font-bold py-3 rounded-xl text-xs hover:border-gold hover:text-gold transition-colors"
              >
                No
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Question {qIdx + 1} of {selected.questions.length}
          </p>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && selected && (
        <div className="space-y-4">
          <div className={`${cfg.bg} ${cfg.border} border-2 rounded-2xl p-5 space-y-3`}>
            <div className="flex items-center gap-3">
              {cfg.icon}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs font-bold text-navy mt-0.5">{selected.label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{advice}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {urgency === "red" ? (
              <a
                href="tel:+353214303072"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow"
              >
                <Phone className="w-4 h-4" /> {cfg.cta}
              </a>
            ) : (
              <button
                onClick={() => router.push(`/portal/booking?concern=${encodeURIComponent(selected.label)}`)}
                className="flex-1 bg-gold hover:bg-yellow-500 text-navy font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow"
              >
                <CalendarDays className="w-4 h-4" /> {cfg.cta}
              </button>
            )}
            <button
              onClick={reset}
              className="flex-1 border-2 border-gray-200 text-navy font-bold py-3 px-4 rounded-xl text-xs hover:border-gold hover:text-gold transition-colors"
            >
              Check Another Symptom
            </button>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed text-center">
            This tool provides general guidance only and is not a substitute for professional dental advice. Always consult Dr. Roghay Alizadeh for a diagnosis.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function WellnessPage() {
  const { user } = useAuthStore();
  const userId = user?.id || "guest";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="font-serif text-2xl font-bold text-navy">Dental Wellness Hub</h1>
        <p className="text-gray-500 text-xs mt-1">
          Track your daily oral care habits and get instant guidance on dental concerns.
        </p>
      </div>

      <HabitTracker userId={userId} />
      <SymptomChecker />
    </div>
  );
}
