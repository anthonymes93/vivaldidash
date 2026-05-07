import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar as CalendarIcon, FileText, ExternalLink } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
}

interface CalendarWidgetProps {
  hoveredBookmark?: HoveredBookmark | null;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ hoveredBookmark }) => {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), (snapshot) => {
      const items: CalendarEvent[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as CalendarEvent));
      setAllEvents(items);
    });
    return () => unsub();
  }, []);

  // Load notes from the bookmark document (same field ExpandedView uses)
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

  // Debounce save
  useEffect(() => {
    if (!hoveredBookmark) return;
    const timer = setTimeout(() => saveNotes(notes), 800);
    return () => clearTimeout(timer);
  }, [notes, hoveredBookmark, saveNotes]);

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

  const getFaviconUrl = (url: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(fullUrl).hostname}`;
    } catch { return ''; }
  };

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
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {/* ── QUICK NOTES MODE ── */}
        {hoveredBookmark ? (
          <motion.div
            key={`notes-${hoveredBookmark.id}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Bookmark Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={getFaviconUrl(hoveredBookmark.url)}
                alt=""
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  objectFit: 'contain', flexShrink: 0,
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '15px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.95)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {hoveredBookmark.title}
                </div>
                <div style={{
                  fontSize: '10px', opacity: 0.35, marginTop: '2px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {hoveredBookmark.url}
                </div>
              </div>
              <a
                href={hoveredBookmark.url.startsWith('http') ? hoveredBookmark.url : `https://${hoveredBookmark.url}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Notes Label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4 }}>
                <FileText size={10} />
                Quick Notes
              </div>
              <AnimatePresence>
                {isSaving && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: '9px', opacity: 0.35, letterSpacing: '0.5px' }}
                  >
                    saving…
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Notes Textarea */}
            <textarea
              className="notes-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Type a note for this bookmark…"
              onWheel={e => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '13px',
                lineHeight: 1.6,
                padding: '14px',
                resize: 'none',
                outline: 'none',
                height: '200px',
                overflowY: 'auto',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(124,77,255,0.4) transparent',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,77,255,0.4)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </motion.div>

        ) : (

          /* ── CALENDAR MODE ── */
          <motion.div
            key="calendar"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* Collapsible Header */}
            <motion.div
              layout
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <AnimatePresence mode="wait">
                {isCollapsed ? (
                  <motion.div
                    key="collapsed-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
                  >
                    <div style={{
                      fontSize: '48px', fontWeight: 700, lineHeight: 1,
                      background: 'linear-gradient(135deg, #7c4dff, #4dabf7)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      {String(currentDay).padStart(2, '0')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>
                        {today.toLocaleString('default', { month: 'long' })}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.4, fontWeight: 500 }}>
                        {year} • {today.toLocaleString('default', { weekday: 'long' })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarIcon size={18} style={{ color: '#7c4dff' }} />
                      {today.toLocaleString('default', { month: 'long' })}
                    </h3>
                    <span style={{ fontSize: '12px', opacity: 0.4, fontWeight: 500 }}>{year}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Collapsible Grid */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
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
                            <span style={{
                              position: 'absolute', top: '2px', right: '2px',
                              width: '4px', height: '4px',
                              background: '#7c4dff', borderRadius: '50%',
                              boxShadow: '0 0 5px #7c4dff',
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Today's Agenda */}
            <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4 }}>
                  Today's Agenda
                </h4>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(124,77,255,0.15)', color: '#a27fff', fontWeight: 600 }}>
                  {todayEvents.length} Events
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {todayEvents.length === 0 ? (
                  <p style={{ fontSize: '13px', opacity: 0.3, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                    No events scheduled
                  </p>
                ) : (
                  todayEvents.slice(0, 3).map(event => (
                    <motion.div layout key={event.id} style={{
                      padding: '12px', background: 'rgba(255,255,255,0.02)',
                      borderRadius: '16px',
                      borderLeft: `3px solid ${event.type === 'work' ? '#4dabf7' : event.type === 'important' ? '#ff6b6b' : '#7c4dff'}`,
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', flexDirection: 'column', gap: '4px',
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
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalendarWidget;
