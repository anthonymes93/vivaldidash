import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StopCircle, 
  Plus, 
  History, 
  BarChart3, 
  Clock, 
  AlertCircle,
  PlusCircle,
  ChevronRight,
  TrendingDown,
  Settings,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, getDoc,
  query, orderBy, Timestamp, limit
} from 'firebase/firestore';

// ── helpers ──────────────────────────────────────────────────────────────────
const toLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const sessionDate = (s: DoomSession): string => {
  if (s.date) return s.date;
  const d = s.startTime?.toDate?.() ?? s.timestamp?.toDate?.();
  return d ? toLocalDate(d) : '';
};

interface DoomSession {
  id: string;
  duration: number;   // minutes
  date: string;       // YYYY-MM-DD local
  startTime: any;     // Timestamp
  endTime: any;       // Timestamp
  timestamp: any;     // legacy compat
  type: 'timer' | 'manual';
}

const HabitsView: React.FC = () => {
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalSessionTime, setTotalSessionTime] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const [sessions, setSessions] = useState<DoomSession[]>([]);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  
  // Allowance State
  const [dailyLimit, setDailyLimit] = useState<number>(60); // in minutes
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitInput, setLimitInput] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Firebase listeners + active-session recovery ─────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'doom_sessions'), orderBy('timestamp', 'desc'), limit(200));
    const unsubSessions = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as DoomSession[]);
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'doomscroll'), snap => {
      if (snap.exists()) setDailyLimit(snap.data().dailyLimit ?? 60);
    });

    // Recover active session after reload
    (async () => {
      const snap = await getDoc(doc(db, 'settings', 'doom_active'));
      if (!snap.exists()) return;
      const { startTime, plannedDuration, plannedEndTime } = snap.data();
      const start: Date = startTime.toDate();
      const plannedEnd: Date = plannedEndTime.toDate();
      const secondsLeft = Math.floor((plannedEnd.getTime() - Date.now()) / 1000);
      if (secondsLeft <= 0) {
        // Session expired while away — log elapsed time and show overlay
        const elapsed = Math.max(1, Math.ceil((Date.now() - start.getTime()) / 60000));
        await addDoc(collection(db, 'doom_sessions'), {
          duration: elapsed, type: 'timer',
          date: toLocalDate(start), startTime, endTime: Timestamp.now(), timestamp: startTime,
        });
        await deleteDoc(doc(db, 'settings', 'doom_active'));
        setShowOverlay(true);
      } else {
        setSessionStartTime(start);
        setTotalSessionTime(plannedDuration);
        setTimeLeft(secondsLeft);
        setIsTimerRunning(true);
      }
    })();

    return () => { unsubSessions(); unsubSettings(); };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      setShowOverlay(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timeLeft]);

  // ── Session helpers ───────────────────────────────────────────────────────
  const saveSession = async (duration: number, type: 'timer' | 'manual', start: Date, end: Date) => {
    if (duration <= 0) return;
    await addDoc(collection(db, 'doom_sessions'), {
      duration, type,
      date: toLocalDate(start),
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      timestamp: Timestamp.fromDate(start), // orderBy compat
    });
  };

  const startSession = async (minutes: number) => {
    const start = new Date();
    const plannedEnd = new Date(start.getTime() + minutes * 60 * 1000);
    await setDoc(doc(db, 'settings', 'doom_active'), {
      startTime: Timestamp.fromDate(start),
      plannedDuration: minutes,
      plannedEndTime: Timestamp.fromDate(plannedEnd),
    });
    setSessionStartTime(start);
    setTotalSessionTime(minutes);
    setTimeLeft(minutes * 60);
    setIsTimerRunning(true);
    setShowOverlay(false);
  };

  const stopSession = async (completed: boolean = true) => {
    const now = new Date();
    const start = sessionStartTime ?? new Date(now.getTime() - totalSessionTime * 60 * 1000);
    const elapsed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 60000));
    const duration = completed ? totalSessionTime : Math.min(elapsed, totalSessionTime);
    await saveSession(duration, 'timer', start, now);
    await deleteDoc(doc(db, 'settings', 'doom_active')).catch(() => {});
    setIsTimerRunning(false); setTimeLeft(null); setSessionStartTime(null); setShowOverlay(false);
  };

  const addExtraTime = async (minutes: number) => {
    const start = sessionStartTime ?? new Date();
    const newTotal = totalSessionTime + minutes;
    const newEnd = new Date(Date.now() + (timeLeft || 0) * 1000 + minutes * 60 * 1000);
    await setDoc(doc(db, 'settings', 'doom_active'), {
      startTime: Timestamp.fromDate(start),
      plannedDuration: newTotal,
      plannedEndTime: Timestamp.fromDate(newEnd),
    });
    setTimeLeft(prev => (prev || 0) + minutes * 60);
    setTotalSessionTime(newTotal);
    setIsTimerRunning(true); setShowOverlay(false);
  };

  const handleManualLog = async () => {
    const mins = parseInt(manualMinutes);
    if (!isNaN(mins) && mins > 0) {
      const end = new Date();
      const start = new Date(end.getTime() - mins * 60 * 1000);
      await saveSession(mins, 'manual', start, end);
      setManualMinutes(''); setIsManualModalOpen(false);
    }
  };

  const handleUpdateLimit = async () => {
    const mins = parseInt(limitInput);
    if (!isNaN(mins) && mins > 0) {
      setDailyLimit(mins);
      await setDoc(doc(db, 'settings', 'doomscroll'), {
        dailyLimit: mins, lastUpdated: Timestamp.now(),
      }, { merge: true });
      setIsLimitModalOpen(false);
    }
  };

  // ── Stats — derived purely from Firebase sessions ────────────────────────
  const getStats = () => {
    const now = new Date();
    const today = toLocalDate(now);
    const weekAgo = toLocalDate(new Date(now.getTime() - 7 * 86400000));
    const monthAgo = toLocalDate(new Date(now.getTime() - 30 * 86400000));
    let dailyTotal = 0, weeklyTotal = 0, monthlyTotal = 0;
    sessions.forEach(s => {
      const d = sessionDate(s);
      if (!d) return;
      if (d === today) dailyTotal += s.duration;
      if (d >= weekAgo) weeklyTotal += s.duration;
      if (d >= monthAgo) monthlyTotal += s.duration;
    });
    const remaining = Math.max(0, dailyLimit - dailyTotal);
    const overscroll = Math.max(0, dailyTotal - dailyLimit);
    const progress = Math.min(100, (dailyTotal / Math.max(dailyLimit, 1)) * 100);
    return { dailyTotal, weeklyTotal, monthlyTotal, remaining, overscroll, progress };
  };

  const stats = getStats();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getWeekData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = toLocalDate(d);
      const total = sessions
        .filter(s => sessionDate(s) === dateStr)
        .reduce((acc, s) => acc + s.duration, 0);
      return { day: days[d.getDay()], total };
    });
  };

  const weekData = getWeekData();
  const maxDaily = Math.max(...weekData.map(d => d.total), dailyLimit);

  // ─── Behavioral Analysis ───────────────────────────────────────────
  const analyzeBehavior = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisWeekStartStr = toLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMon));
    const lastWeekStartStr = toLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMon - 7));
    const lastWeekEndStr = thisWeekStartStr; // exclusive

    let thisWeekTotal = 0, lastWeekTotal = 0;

    // Build last-7-days lookup
    const last7: { dateStr: string; date: Date; total: number; isWeekend: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = toLocalDate(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const total = sessions.filter(s => sessionDate(s) === dateStr).reduce((a, s) => a + s.duration, 0);
      last7.push({ dateStr, date: d, total, isWeekend });
    }

    sessions.forEach(s => {
      const d = sessionDate(s);
      if (!d) return;
      if (d >= thisWeekStartStr) thisWeekTotal += s.duration;
      else if (d >= lastWeekStartStr && d < lastWeekEndStr) lastWeekTotal += s.duration;
    });

    // 1. Weekly Comparison
    let weeklyChange: { pct: number; better: boolean; label: string } | null = null;
    if (lastWeekTotal > 0) {
      const pct = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
      weeklyChange = { pct: Math.abs(pct), better: pct <= 0, label: pct <= 0 ? 'Better week' : 'Worse week' };
    }

    // 2. Pattern Detection — use startTime for accurate hour-of-day
    const patterns: string[] = [];
    const hourBuckets: Record<string, number> = { night: 0, evening: 0, afternoon: 0, morning: 0 };
    sessions.forEach(s => {
      const d: Date | null = s.startTime?.toDate?.() ?? s.timestamp?.toDate?.() ?? null;
      if (!d) return;
      const h = d.getHours();
      if (h >= 22 || h < 6) hourBuckets.night += s.duration;
      else if (h >= 17) hourBuckets.evening += s.duration;
      else if (h >= 12) hourBuckets.afternoon += s.duration;
      else hourBuckets.morning += s.duration;
    });
    const topSlot = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
    if (topSlot && topSlot[1] > 0) {
      const labels: Record<string, string> = {
        night: 'Most of your scrolling happens late at night (after 10PM).',
        evening: 'Most of your scrolling happens in the evening.',
        afternoon: 'Most of your scrolling happens in the afternoon.',
        morning: 'You tend to scroll most in the morning.'
      };
      patterns.push(labels[topSlot[0]]);
    }
    const weekendAvg = last7.filter(d => d.isWeekend).reduce((a, d) => a + d.total, 0) / Math.max(last7.filter(d => d.isWeekend).length, 1);
    const weekdayAvg = last7.filter(d => !d.isWeekend).reduce((a, d) => a + d.total, 0) / Math.max(last7.filter(d => !d.isWeekend).length, 1);
    if (weekendAvg > weekdayAvg * 1.3 && weekendAvg > 0) patterns.push('Weekend usage is noticeably higher than weekdays.');

    // 3. Intention vs Reality
    const activeDays = last7.filter(d => d.total > 0).length;
    const daysWithinLimit = last7.filter(d => d.total > 0 && d.total <= dailyLimit).length;
    const todayEntry = last7[last7.length - 1];

    // 4. Weekly Summary
    const avgDaily = Math.round(last7.reduce((a, d) => a + d.total, 0) / 7);
    const activeLast7 = last7.filter(d => d.total > 0);
    const bestDay = activeLast7.length > 0 ? activeLast7.reduce((a, b) => b.total < a.total ? b : a) : null;
    const worstDay = last7.reduce((a, b) => b.total > a.total ? b : a, last7[0]);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return { weeklyChange, patterns, daysWithinLimit, activeDays, todayEntry, avgDaily, bestDay, worstDay, dayNames, thisWeekTotal, last7 };
  };

  const behavior = analyzeBehavior();
  // ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      padding: '0 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '60px',
      color: '#e0e0e0',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingDown size={32} color="#ff4d4d" />
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'white', letterSpacing: '-1.5px', margin: 0 }}>
              The Mirror
            </h1>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px', margin: 0, fontWeight: 400 }}>
            A calm look at your attention.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <motion.button
            whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setLimitInput(dailyLimit.toString());
              setIsLimitModalOpen(true);
            }}
            style={{
              padding: '14px 24px',
              borderRadius: '16px',
              background: 'rgba(12, 12, 18, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            <Settings size={18} />
            Set Daily Limit
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsManualModalOpen(true)}
            style={{
              padding: '14px 24px',
              borderRadius: '16px',
              background: 'rgba(12, 12, 18, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            <Plus size={18} />
            Log Past Session
          </motion.button>
        </div>
      </div>

      {/* ── AT A GLANCE STATUS CARD ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: stats.overscroll > 0
            ? 'rgba(30, 8, 8, 0.88)'
            : 'rgba(12, 12, 18, 0.88)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${stats.overscroll > 0 ? 'rgba(255,77,77,0.25)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '28px',
          padding: '32px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '40px',
        }}
      >
        {/* Left: Today's number */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Today</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '48px', fontWeight: 900, color: 'white', letterSpacing: '-2px' }}>{stats.dailyTotal}</span>
            <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>/ {dailyLimit} min</span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <motion.div
              animate={{ width: `${stats.progress}%` }}
              style={{ height: '100%', borderRadius: '2px', background: stats.progress >= 100 ? '#ff4d4d' : stats.progress >= 75 ? '#ffb84d' : '#7c4dff' }}
            />
          </div>
        </div>

        {/* Center: State label */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
          {stats.overscroll > 0 ? (
            <>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ff4d4d', textTransform: 'uppercase', letterSpacing: '1px' }}>Over your daily limit</span>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#ff4d4d', letterSpacing: '-1px' }}>+{stats.overscroll} min</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '13px', fontWeight: 700, color: stats.remaining <= 15 ? '#ffb84d' : '#4dff9b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stats.remaining <= 15 && stats.remaining > 0 ? 'Almost at your limit' : stats.remaining === 0 ? 'At your limit' : 'Within your limit'}
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900, color: stats.remaining <= 15 ? '#ffb84d' : '#4dff9b', letterSpacing: '-1px' }}>{stats.remaining} min left</span>
            </>
          )}
        </div>

        {/* Right: Weekly trend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>vs last week</span>
          {behavior.weeklyChange ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {behavior.weeklyChange.better ? <ArrowDown size={20} color="#4dff9b" /> : <ArrowUp size={20} color="#ff4d4d" />}
                <span style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-1.5px', color: behavior.weeklyChange.better ? '#4dff9b' : '#ff4d4d' }}>
                  {behavior.weeklyChange.better ? '-' : '+'}{behavior.weeklyChange.pct}%
                </span>
              </div>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                {behavior.weeklyChange.better ? 'You are scrolling less than last week.' : 'You are scrolling more than last week.'}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.25)' }}>No prior week to compare.</span>
          )}
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
        {/* Left Column: Timer & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          <div style={{
            background: 'rgba(12, 12, 18, 0.82)',
            backdropFilter: 'blur(24px)',
            borderRadius: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {isTimerRunning ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>Current Session</span>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ fontSize: '120px', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums', letterSpacing: '-4px' }}
                  >
                    {formatTime(timeLeft || 0)}
                  </motion.div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05, background: 'rgba(255, 77, 77, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => stopSession(false)}
                  style={{
                    padding: '20px 48px',
                    borderRadius: '24px',
                    background: 'rgba(255, 77, 77, 0.1)',
                    border: '1px solid rgba(255, 77, 77, 0.2)',
                    color: '#ff4d4d',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <StopCircle size={24} />
                  Stop Scrolling
                </motion.button>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Start tracking</h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', lineHeight: '1.6' }}>Choose a duration before you start scrolling. Honest awareness is the first step.</p>
                </div>

                <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center' }}>
                  {[15, 30, 60].map(m => (
                    <motion.button
                      key={m}
                      whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.08)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startSession(m)}
                      style={{
                        flex: 1,
                        maxWidth: '120px',
                        padding: '24px',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '24px', fontWeight: 800 }}>{m}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>MINS</span>
                    </motion.button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '300px' }}>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>OR</span>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
                  <input 
                    type="number" 
                    placeholder="Custom mins" 
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: '16px',
                      padding: '16px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const m = parseInt(customMinutes);
                      if (m > 0) startSession(m);
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'white',
                      border: 'none',
                      color: 'black',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>
              </>
            )}
          </div>

          {/* Weekly Graph */}
          <div style={{
            background: 'rgba(12, 12, 18, 0.82)',
            backdropFilter: 'blur(24px)',
            borderRadius: '32px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BarChart3 size={20} color="rgba(255,255,255,0.4)" />
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Weekly Activity</h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', padding: '0 10px' }}>
              {weekData.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '40px' }}>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    {d.total > 0 && (
                      <span style={{ position: 'absolute', top: '-20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{d.total}m</span>
                    )}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.total / maxDaily) * 120}px` }}
                      style={{
                        width: '8px',
                        background: d.total > dailyLimit ? '#ff4d4d' : 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        transition: 'all 0.3s'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Right column top: Week summary (slim) */}
          <div style={{
            background: 'rgba(12, 12, 18, 0.82)',
            backdropFilter: 'blur(24px)',
            borderRadius: '32px',
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>This week</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Total', value: `${behavior.thisWeekTotal}m` },
                { label: 'Daily avg', value: `${behavior.avgDaily}m` },
                { label: 'Best day', value: behavior.bestDay ? `${behavior.dayNames[behavior.bestDay.date.getDay()]} · ${behavior.bestDay.total}m` : '—', accent: '#4dff9b' },
                { label: 'Worst day', value: behavior.worstDay?.total > 0 ? `${behavior.dayNames[behavior.worstDay.date.getDay()]} · ${behavior.worstDay.total}m` : '—', accent: behavior.worstDay?.total > dailyLimit ? '#ff4d4d' : undefined },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{item.label}</span>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: (item as any).accent ?? 'white' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* History List */}
          <div style={{
            background: 'rgba(12, 12, 18, 0.82)',
            backdropFilter: 'blur(24px)',
            borderRadius: '32px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }} className="hide-scrollbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History size={18} color="rgba(255,255,255,0.4)" />
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>Recent History</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px' }}>No history recorded yet.</p>
              ) : (
                sessions.map((s, i) => (
                  <div key={s.id} style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {s.type === 'timer' ? <Clock size={14} color="rgba(255,255,255,0.3)" /> : <PlusCircle size={14} color="rgba(255,255,255,0.3)" />}
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{s.duration} min</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
                      {s.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BEHAVIORAL INSIGHTS (ranked, 3 max) ─────────────────────────── */}
      {(() => {
        // Build ranked list — most impactful first, max 3
        type Insight = { key: string; label: string; detail: string; accent: string; bar?: number };
        const ranked: Insight[] = [];

        // #1 — Limit adherence (always highest priority)
        if (behavior.activeDays > 0) {
          const ratio = behavior.daysWithinLimit / behavior.activeDays;
          const accent = ratio >= 0.7 ? '#4dff9b' : ratio >= 0.4 ? '#ffb84d' : '#ff4d4d';
          ranked.push({
            key: 'limit',
            label: `You stayed within your limit ${behavior.daysWithinLimit} of ${behavior.activeDays} active days this week.`,
            detail: ratio >= 0.7 ? 'Consistent.' : ratio >= 0.4 ? 'Room for improvement.' : 'Most days exceeded the limit.',
            accent,
            bar: ratio,
          });
        }

        // #2 — Weekly trajectory
        if (behavior.weeklyChange) {
          ranked.push({
            key: 'week',
            label: behavior.weeklyChange.better
              ? `You used ${behavior.weeklyChange.pct}% less time than last week.`
              : `You used ${behavior.weeklyChange.pct}% more time than last week.`,
            detail: behavior.weeklyChange.better ? 'A step in the right direction.' : 'Usage is trending up.',
            accent: behavior.weeklyChange.better ? '#4dff9b' : '#ff4d4d',
          });
        }

        // #3 — Time-of-day pattern
        if (behavior.patterns.length > 0) {
          ranked.push({
            key: 'pattern',
            label: behavior.patterns[0],
            detail: 'Pattern detected from all sessions.',
            accent: 'rgba(255,255,255,0.5)',
          });
        }

        if (ranked.length === 0) return null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={16} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>What the data shows</span>
            </div>
            {ranked.map((ins, i) => (
              <div key={ins.key} style={{
                background: 'rgba(12, 12, 18, 0.82)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${ins.accent}`,
                borderRadius: '20px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', fontWeight: 500 }}>{ins.label}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', marginTop: '2px', flexShrink: 0 }}>{ins.detail}</span>
                </div>
                {ins.bar !== undefined && (
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${ins.bar * 100}%` }}
                      style={{ height: '100%', background: ins.accent, borderRadius: '2px' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Daily Limit Modal */}
      <AnimatePresence>
        {isLimitModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '24px'
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLimitModalOpen(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                position: 'relative',
                width: '100%', maxWidth: '400px',
                background: 'rgba(20, 20, 25, 0.98)',
                borderRadius: '32px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', flexDirection: 'column', gap: '32px'
              }}
            >
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Daily Allowance</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Set your maximum daily scrolling limit.</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>LIMIT (MINUTES)</label>
                  <input
                    autoFocus
                    type="number"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    placeholder="Enter limit..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '16px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button
                    onClick={() => setIsLimitModalOpen(false)}
                    style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateLimit}
                    style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'white', border: 'none', color: 'black', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save Limit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Log Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '24px'
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualModalOpen(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                position: 'relative',
                width: '100%', maxWidth: '400px',
                background: 'rgba(20, 20, 25, 0.98)',
                borderRadius: '32px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', flexDirection: 'column', gap: '32px'
              }}
            >
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Manual Entry</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Log time if you forgot to start the timer.</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>DURATION (MINUTES)</label>
                  <input
                    autoFocus
                    type="number"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    placeholder="Enter minutes..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '16px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button
                    onClick={() => setIsManualModalOpen(false)}
                    style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualLog}
                    style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'white', border: 'none', color: 'black', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Log Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Time's Up Overlay (stays same) */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(20, 0, 0, 0.98)',
              backdropFilter: 'blur(40px)',
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'rgba(255, 77, 77, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(255, 77, 77, 0.2)'
              }}>
                <AlertCircle size={48} color="#ff4d4d" />
              </div>
              <h1 style={{ fontSize: '72px', fontWeight: 900, color: '#ff4d4d', letterSpacing: '4px', margin: 0 }}>TIME'S UP</h1>
              <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', lineHeight: '1.6' }}>
                The mirror shows your choice. <br/> Stop here, or take ten more.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => stopSession(true)}
                style={{
                  padding: '24px 60px',
                  borderRadius: '24px',
                  background: 'white',
                  border: 'none',
                  color: 'black',
                  fontSize: '20px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Stop Session
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addExtraTime(10)}
                style={{
                  padding: '24px 60px',
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Add 10 Minutes
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default HabitsView;
