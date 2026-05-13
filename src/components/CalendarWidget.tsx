import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar as CalendarIcon, FileText, ExternalLink, StickyNote, Pause, Play } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import BookmarkIcon from './BookmarkIcon';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  time?: string;
}

interface HoveredBookmark {
  id: string;
  title: string;
  url: string;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
}

interface CalendarWidgetProps {
  hoveredBookmark?: HoveredBookmark | null;
  widgetPauseMins?: number; // how long to pause rotation (minutes), from settings
  isPaused?: boolean;
  pauseSecondsLeft?: number;
  onPauseToggle?: () => void;
  onCancelPause?: () => void;
  activeTab?: 'calendar' | 'notes';
  onTabChange?: (tab: 'calendar' | 'notes') => void;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const ROTATE_INTERVAL = 5000;

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  hoveredBookmark, 
  widgetPauseMins = 10,
  isPaused = false,
  pauseSecondsLeft = 0,
  onPauseToggle,
  onCancelPause,
  activeTab = 'calendar',
  onTabChange,
  isCollapsed = true,
  onCollapseChange
}) => {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState('');
  const [scratchpad, setScratchpad] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingScratch, setIsSavingScratch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const caretTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // ── Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), (snapshot) => {
      const items: CalendarEvent[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as CalendarEvent));
      setAllEvents(items);
    });
    return () => unsub();
  }, []);

  // ── Bookmark notes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!hoveredBookmark) { setNotes(''); return; }
    getDoc(doc(db, 'bookmarks', hoveredBookmark.id)).then((snap) => {
      setNotes(snap.exists() ? snap.data()?.notes || '' : '');
    });
  }, [hoveredBookmark?.id]);

  const saveNotes = useCallback(async (value: string) => {
    if (!hoveredBookmark) return;
    setIsSaving(true);
    await updateDoc(doc(db, 'bookmarks', hoveredBookmark.id), { notes: value });
    setIsSaving(false);
  }, [hoveredBookmark]);

  useEffect(() => {
    if (!hoveredBookmark) return;
    const timer = setTimeout(() => saveNotes(notes), 800);
    return () => clearTimeout(timer);
  }, [notes, hoveredBookmark, saveNotes]);

  // ── Scratchpad (general) ───────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'widget_notes'), (snap) => {
      if (snap.exists()) {
        setScratchpad(snap.data()?.content || '');
      }
    });
    return () => unsub();
  }, []);

  // Resize textarea whenever the notes tab becomes visible or content changes
  useEffect(() => {
    if (activeTab !== 'notes') return;

    const resize = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    // "Shotgun" approach: Fire at multiple points to catch the DOM after AnimatePresence mode="wait"
    // and after the spring animation settles.
    const timers = [0, 50, 150, 300, 600, 1000].map(ms => setTimeout(resize, ms));

    return () => timers.forEach(clearTimeout);
  }, [activeTab, scratchpad]);

  const saveScratchpad = useCallback(async (value: string) => {
    setIsSavingScratch(true);
    await setDoc(doc(db, 'settings', 'widget_notes'), { content: value }, { merge: true });
    setIsSavingScratch(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => saveScratchpad(scratchpad), 800);
    return () => clearTimeout(timer);
  }, [scratchpad, saveScratchpad]);

  // ── Auto-rotation (stops if hovering, typing, or paused) ──────────
  const startRotation = useCallback(() => {
    if (rotationRef.current) clearInterval(rotationRef.current);
    rotationRef.current = setInterval(() => {
      if (onTabChange) onTabChange(activeTab === 'calendar' ? 'notes' : 'calendar');
    }, ROTATE_INTERVAL);
  }, [activeTab, onTabChange]);

  useEffect(() => {
    if (hoveredBookmark || isTyping || isPaused) {
      if (rotationRef.current) clearInterval(rotationRef.current);
      return;
    }
    startRotation();
    return () => { if (rotationRef.current) clearInterval(rotationRef.current); };
  }, [hoveredBookmark, isTyping, isPaused, startRotation]);

  // ── Pause / resume ─────────────────────────────────────────────────
  const handlePause = () => {
    if (onPauseToggle) onPauseToggle();
  };

  const formatCountdown = (secs: number) => {
    const m = Math.ceil(secs / 60);
    return `${m}m`;
  };

  const handleScratchpadChange = (value: string) => {
    setScratchpad(value);
    setIsTyping(true);
    // Show caret immediately on keystroke
    if (textareaRef.current) {
      textareaRef.current.style.caretColor = '';
      // Auto-grow: reset to auto first so it can shrink, then expand to content
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    // Clear existing timers
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (caretTimerRef.current) clearTimeout(caretTimerRef.current);
    // Safety fallback for rotation
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 10000);
    // Hide caret directly on DOM after 3s idle
    caretTimerRef.current = setTimeout(() => {
      if (textareaRef.current) textareaRef.current.style.caretColor = 'transparent';
    }, 3000);
  };

  const handleScratchpadBlur = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (caretTimerRef.current) clearTimeout(caretTimerRef.current);
    setIsTyping(false);
    // Reset caret so it's visible on next focus
    if (textareaRef.current) textareaRef.current.style.caretColor = '';
  };

  const handleManualSwitch = (tab: 'calendar' | 'notes') => {
    // Cancel pause when user manually switches
    if (onCancelPause) onCancelPause();
    if (onTabChange) onTabChange(tab);
    startRotation();
  };

  // ── Calendar helpers ───────────────────────────────────────────────
  const todayEvents = allEvents.filter(e => e.date === dateStr);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const currentDay = today.getDate();

  const getEventCountForDay = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter(e => e.date === dStr).length;
  };

  const miniDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) miniDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) miniDays.push(i);

  return (
    <motion.div
      animate={{ height: 'auto' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        width: '320px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(30px)',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: hoveredBookmark
          ? '0 20px 60px rgba(124, 77, 255, 0.2), 0 0 0 1px rgba(124,77,255,0.15)'
          : '0 20px 60px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <AnimatePresence mode="wait">
        {/* ── BOOKMARK NOTES (hovering a bookmark) ── */}
        {hoveredBookmark ? (
          <motion.div
            key={`notes-${hoveredBookmark.id}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookmarkIcon
                title={hoveredBookmark.title}
                url={hoveredBookmark.url}
                iconType={hoveredBookmark.iconType}
                lucideIcon={hoveredBookmark.lucideIcon}
                iconColor={hoveredBookmark.iconColor}
                customIconUrl={hoveredBookmark.customIconUrl}
                size={36}
                noBackground={true}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hoveredBookmark.title}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.35, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hoveredBookmark.url}
                </div>
              </div>
              <a
                href={(hoveredBookmark.url || '').startsWith('http') ? hoveredBookmark.url : `https://${hoveredBookmark.url || ''}`}
                target="_blank" rel="noreferrer"
                style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4 }}>
                <FileText size={10} /> Quick Notes
              </div>
              <AnimatePresence>
                {isSaving && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontSize: '9px', opacity: 0.35, letterSpacing: '0.5px' }}>saving…</motion.span>
                )}
              </AnimatePresence>
            </div>
            <textarea
              className="notes-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Type a note for this bookmark…"
              onWheel={e => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', color: 'rgba(255,255,255,0.85)', fontSize: '13px',
                lineHeight: 1.6, padding: '14px', resize: 'none', outline: 'none',
                height: '200px', overflowY: 'auto', fontFamily: 'inherit',
                transition: 'border-color 0.2s', scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(124,77,255,0.4) transparent',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,77,255,0.4)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </motion.div>

        ) : (
          /* ── AUTO-ROTATING PANEL ── */
          <motion.div
            key="rotating-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Header row: label + dot indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'calendar' ? (
                    <motion.span key="cal-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CalendarIcon size={11} /> Calendar
                    </motion.span>
                  ) : (
                    <motion.span key="note-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <StickyNote size={11} /> Scratchpad
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Right side: pause button + pill dots */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isPaused ? (
                  /* Countdown + resume button */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums', minWidth: '48px', textAlign: 'right' }}>
                      {formatCountdown(pauseSecondsLeft)}
                    </span>
                    <motion.button
                      onClick={handlePause}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      title="Resume rotation"
                      style={{ background: 'rgba(124,77,255,0.2)', border: '1px solid rgba(124,77,255,0.35)', borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      <Play size={10} color="#a27fff" />
                    </motion.button>
                  </div>
                ) : (
                  /* Dots + pause button */
                  <>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {(['calendar', 'notes'] as const).map(tab => (
                        <motion.button
                          key={tab}
                          onClick={() => handleManualSwitch(tab)}
                          animate={{
                            width: activeTab === tab ? 18 : 6,
                            background: activeTab === tab ? '#7c4dff' : 'rgba(255,255,255,0.18)',
                          }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          style={{ height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0 }}
                          aria-label={`Switch to ${tab}`}
                        />
                      ))}
                    </div>
                    <motion.button
                      onClick={handlePause}
                      whileHover={{ scale: 1.15, background: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      title={`Pause rotation for ${widgetPauseMins} minute${widgetPauseMins !== 1 ? 's' : ''}`}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      <Pause size={9} color="rgba(255,255,255,0.4)" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Animated content */}
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'calendar' ? (
                <motion.div
                  key="calendar-panel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  {/* Calendar header */}
                  <motion.div layout onClick={() => onCollapseChange?.(!isCollapsed)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <AnimatePresence mode="wait">
                      {isCollapsed ? (
                        <motion.div key="collapsed" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1, background: 'linear-gradient(135deg, #7c4dff, #4dabf7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {String(currentDay).padStart(2, '0')}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>{today.toLocaleString('default', { month: 'long' })}</div>
                            <div style={{ fontSize: '12px', opacity: 0.4, fontWeight: 500 }}>{year} • {today.toLocaleString('default', { weekday: 'long' })}</div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="expanded" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarIcon size={18} style={{ color: '#7c4dff' }} />
                            {today.toLocaleString('default', { month: 'long' })}
                          </h3>
                          <span style={{ fontSize: '12px', opacity: 0.4, fontWeight: 500 }}>{year}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Mini grid */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', fontSize: '10px', textAlign: 'center', paddingTop: '10px' }}>
                          {['S','M','T','W','T','F','S'].map((d, i) => (
                            <div key={i} style={{ opacity: 0.3, fontWeight: 700, marginBottom: '6px' }}>{d}</div>
                          ))}
                          {miniDays.map((day, i) => {
                            const eventCount = day ? getEventCountForDay(day) : 0;
                            return (
                              <div key={i} style={{
                                height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '8px',
                                background: day === currentDay ? 'rgba(124,77,255,0.2)' : 'transparent',
                                border: day === currentDay ? '1px solid rgba(124,77,255,0.3)' : 'none',
                                color: day === currentDay ? '#7c4dff' : day ? 'rgba(255,255,255,0.7)' : 'transparent',
                                fontWeight: day === currentDay ? 700 : 400,
                                position: 'relative',
                              }}>
                                {day}
                                {day && eventCount > 0 && (
                                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '4px', height: '4px', background: '#7c4dff', borderRadius: '50%', boxShadow: '0 0 5px #7c4dff' }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                  {/* Agenda */}
                  <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4 }}>Today's Agenda</h4>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(124,77,255,0.15)', color: '#a27fff', fontWeight: 600 }}>
                        {todayEvents.length} Events
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {todayEvents.length === 0 ? (
                        <p style={{ fontSize: '13px', opacity: 0.3, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>No events scheduled</p>
                      ) : (
                        todayEvents.slice(0, 3).map(event => (
                          <motion.div layout key={event.id} style={{
                            padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
                            borderLeft: `3px solid ${event.type === 'work' ? '#4dabf7' : event.type === 'important' ? '#ff6b6b' : '#7c4dff'}`,
                            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px',
                          }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{event.title}</div>
                            {event.time && (
                              <div style={{ fontSize: '10px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} /> {event.time}
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                      {todayEvents.length > 3 && (
                        <div style={{ fontSize: '10px', textAlign: 'center', opacity: 0.3, letterSpacing: '0.5px' }}>
                          + {todayEvents.length - 3} MORE EVENTS
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>

              ) : (
                /* ── SCRATCHPAD ── */
                <motion.div
                  key="scratchpad-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  {/* Scratchpad header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1, background: 'linear-gradient(135deg, #4dabf7, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {String(currentDay).padStart(2, '0')}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600 }}>{today.toLocaleString('default', { weekday: 'long' })}</div>
                        <div style={{ fontSize: '11px', opacity: 0.35 }}>{today.toLocaleString('default', { month: 'long' })} {year}</div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isSavingScratch && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ fontSize: '9px', opacity: 0.35, letterSpacing: '0.5px' }}>saving…</motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                  <textarea
                    ref={(el) => {
                      textareaRef.current = el;
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = `${el.scrollHeight}px`;
                      }
                    }}
                    className="notes-textarea"
                    value={scratchpad}
                    onChange={e => handleScratchpadChange(e.target.value)}
                    placeholder="Quick thoughts, reminders, anything…"
                    onWheel={e => e.stopPropagation()}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px', color: 'rgba(255,255,255,0.85)', fontSize: '13px',
                      lineHeight: 1.7, padding: '14px', resize: 'none', outline: 'none',
                      minHeight: '120px', overflow: 'hidden', fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(124,77,255,0.4) transparent',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(124,77,255,0.4)';
                      e.target.style.caretColor = '';
                      setIsTyping(true);
                      // Start 3s caret-hide timer from the moment user clicks in
                      if (caretTimerRef.current) clearTimeout(caretTimerRef.current);
                      caretTimerRef.current = setTimeout(() => {
                        if (textareaRef.current) textareaRef.current.style.caretColor = 'transparent';
                      }, 3000);
                    }}
                    onClick={() => {
                      if (textareaRef.current) textareaRef.current.style.caretColor = '';
                      if (caretTimerRef.current) clearTimeout(caretTimerRef.current);
                      caretTimerRef.current = setTimeout(() => {
                        if (textareaRef.current) textareaRef.current.style.caretColor = 'transparent';
                      }, 3000);
                    }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; handleScratchpadBlur(); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalendarWidget;
