import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Plus, Trash2, Clock, Tag } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: 'work' | 'personal' | 'important';
  time?: string;
}

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  
  // Form State
  const [newEvenTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventType, setNewEventType] = useState<'work' | 'personal' | 'important'>('personal');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), (snapshot) => {
      const items: CalendarEvent[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as CalendarEvent));
      setEvents(items);
    });
    return () => unsub();
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const addEvent = async () => {
    if (!newEvenTitle || !selectedDay) return;
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    await addDoc(collection(db, 'events'), {
      title: newEvenTitle,
      time: newEventTime,
      type: newEventType,
      date: dateStr,
      description: '',
    });

    setNewEventTitle('');
    setNewEventTime('');
    setIsAddingEvent(false);
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'events', id));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'work': return '#4dabf7';
      case 'important': return '#ff6b6b';
      default: return '#7c4dff';
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1400px',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      color: 'white',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '20px 30px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '1px', margin: 0 }}>
          {monthName} <span style={{ opacity: 0.5, fontWeight: 300 }}>{year}</span>
        </h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={24} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={24} />
          </motion.button>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        minHeight: '600px',
      }}>
        {/* Days of Week */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '16px',
          marginBottom: '16px',
        }}>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDate.toString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '16px',
              flex: 1,
              gridAutoRows: 'minmax(100px, 1fr)',
            }}
          >
            {days.map((day, index) => {
              const isToday = day && 
                new Date().getDate() === day && 
                new Date().getMonth() === month && 
                new Date().getFullYear() === year;

              const dayEvents = day ? getEventsForDay(day) : [];

              return (
                <motion.div
                  key={index}
                  onClick={() => day && setSelectedDay(day)}
                  style={{
                    background: day ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    border: day ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    borderRadius: '16px',
                    padding: '16px',
                    minHeight: '120px',
                    position: 'relative',
                    transition: 'all 0.2s',
                    boxShadow: isToday ? '0 0 0 2px rgba(124, 77, 255, 0.5)' : 'none',
                    cursor: day ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (day) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (day) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  {day && (
                    <>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? '#7c4dff' : 'rgba(255, 255, 255, 0.9)',
                      }}>
                        {day}
                      </span>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            style={{
                              width: '100%',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: `${getTypeColor(event.type)}33`,
                              color: getTypeColor(event.type),
                              border: `1px solid ${getTypeColor(event.type)}44`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Expanded Day View Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => {
              setSelectedDay(null);
              setIsAddingEvent(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '900px',
                height: '700px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(40px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
              }}
            >
              <button
                onClick={() => {
                  setSelectedDay(null);
                  setIsAddingEvent(false);
                }}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  color: 'white',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <X size={24} />
              </button>

              <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>
                      {monthName} {selectedDay}, {year}
                    </h3>
                    <h2 style={{ fontSize: '48px', fontWeight: 700, margin: 0 }}>
                      Schedule
                    </h2>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddingEvent(!isAddingEvent)}
                    style={{
                      padding: '12px 24px',
                      background: '#7c4dff',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 20px rgba(124, 77, 255, 0.3)',
                    }}
                  >
                    <Plus size={20} /> Add Event
                  </motion.button>
                </div>

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', overflow: 'hidden' }}>
                  {/* Left Column: Event List */}
                  <div style={{ 
                    overflowY: 'auto',
                    paddingRight: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    {getEventsForDay(selectedDay).length === 0 ? (
                      <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Clock size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>No events for this day</p>
                      </div>
                    ) : (
                      getEventsForDay(selectedDay).map(event => (
                        <motion.div
                          layout
                          key={event.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '20px',
                            padding: '20px',
                            border: `1px solid ${getTypeColor(event.type)}33`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '4px', height: '40px', background: getTypeColor(event.type), borderRadius: '4px' }} />
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{event.title}</h4>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', opacity: 0.5 }}>
                                {event.time && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {event.time}</span>}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> {event.type}</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteEvent(event.id)}
                            style={{ padding: '10px', borderRadius: '12px', color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Right Column: Add Event Form */}
                  <div style={{ position: 'relative' }}>
                    <AnimatePresence>
                      {isAddingEvent ? (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '24px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                          }}
                        >
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>New Event</h4>
                          
                          <div className="form-group">
                            <label>Title</label>
                            <input 
                              autoFocus
                              className="form-input"
                              placeholder="What's happening?"
                              value={newEvenTitle}
                              onChange={e => setNewEventTitle(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label>Time</label>
                            <input 
                              type="time"
                              className="form-input"
                              value={newEventTime}
                              onChange={e => setNewEventTime(e.target.value)}
                              style={{ colorScheme: 'dark' }}
                            />
                          </div>

                          <div className="form-group">
                            <label>Category</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {['personal', 'work', 'important'].map(type => (
                                <button
                                  key={type}
                                  onClick={() => setNewEventType(type as any)}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    textTransform: 'capitalize',
                                    background: newEventType === type ? getTypeColor(type) : 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: `1px solid ${newEventType === type ? 'transparent' : 'rgba(255,255,255,0.1)'}`
                                  }}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button 
                            className="primary-button" 
                            style={{ marginTop: '10px' }}
                            onClick={addEvent}
                          >
                            Create Event
                          </button>
                        </motion.div>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px', opacity: 0.3 }}>
                          <p>Click "Add Event" to schedule something new</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
