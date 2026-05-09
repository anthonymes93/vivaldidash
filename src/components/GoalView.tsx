import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface GoalPoint {
  text: string;
  subPoints?: string[];
}

interface MainGoal {
  id: string;
  text: string;
  order: number;
  pros?: GoalPoint[];
  cons?: GoalPoint[];
}

const GoalView: React.FC = () => {
  const [goals, setGoals] = useState<MainGoal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingPoint, setEditingPoint] = useState<{ type: 'pro' | 'con', index: number, subIndex?: number } | null>(null);
  const [pointValue, setPointValue] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'main_goals'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MainGoal));
      setGoals(goalsData);
      
      if (goalsData.length > 0 && !activeGoalId) {
        setActiveGoalId(goalsData[0].id);
      } else if (goalsData.length === 0 && !isLoading) {
        handleNewGoal();
      }
      setIsLoading(false);
    });
    return unsub;
  }, [activeGoalId, isLoading]);

  const activeGoal = goals.find(g => g.id === activeGoalId);

  useEffect(() => {
    if (activeGoal) {
      setInputValue(activeGoal.text);
    }
  }, [activeGoalId, goals]);

  const handleNewGoal = async () => {
    const newGoal = {
      text: '',
      order: goals.length > 0 ? Math.max(...goals.map(g => g.order)) + 1 : 0,
      createdAt: serverTimestamp(),
      pros: [],
      cons: []
    };
    const docRef = await addDoc(collection(db, 'main_goals'), newGoal);
    setActiveGoalId(docRef.id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (activeGoalId && inputValue.trim()) {
      await updateDoc(doc(db, 'main_goals', activeGoalId), { text: inputValue });
      setIsEditing(false);
    }
  };

  const handleAddPoint = async (type: 'pro' | 'con') => {
    if (!activeGoalId || !activeGoal) return;
    const currentPoints = type === 'pro' ? (activeGoal.pros || []) : (activeGoal.cons || []);
    const updatedPoints = [...currentPoints, { text: '', subPoints: [] }];
    await updateDoc(doc(db, 'main_goals', activeGoalId), { [type === 'pro' ? 'pros' : 'cons']: updatedPoints });
    setEditingPoint({ type, index: updatedPoints.length - 1 });
    setPointValue('');
  };

  const handleAddSubPoint = async (e: React.MouseEvent, type: 'pro' | 'con', index: number) => {
    e.stopPropagation();
    if (!activeGoalId || !activeGoal) return;
    const currentPoints = type === 'pro' ? [...(activeGoal.pros || [])] : [...(activeGoal.cons || [])];
    const point = currentPoints[index];
    const updatedSubPoints = [...(point.subPoints || []), ''];
    currentPoints[index] = { ...point, subPoints: updatedSubPoints };
    
    await updateDoc(doc(db, 'main_goals', activeGoalId), { [type === 'pro' ? 'pros' : 'cons']: currentPoints });
    setEditingPoint({ type, index, subIndex: updatedSubPoints.length - 1 });
    setPointValue('');
  };

  const handleSavePoint = async () => {
    if (!activeGoalId || !activeGoal || !editingPoint) return;
    const { type, index, subIndex } = editingPoint;
    const currentPoints = type === 'pro' ? [...(activeGoal.pros || [])] : [...(activeGoal.cons || [])];
    
    if (subIndex !== undefined) {
      const point = currentPoints[index];
      const subs = [...(point.subPoints || [])];
      if (pointValue.trim()) {
        subs[subIndex] = pointValue;
      } else {
        subs.splice(subIndex, 1);
      }
      currentPoints[index] = { ...point, subPoints: subs };
    } else {
      if (pointValue.trim()) {
        currentPoints[index].text = pointValue;
      } else if (!(currentPoints[index].subPoints?.length)) {
        currentPoints.splice(index, 1);
      }
    }
    
    await updateDoc(doc(db, 'main_goals', activeGoalId), { [type === 'pro' ? 'pros' : 'cons']: currentPoints });
    setEditingPoint(null);
  };

  const handleDeletePoint = async (e: React.MouseEvent, type: 'pro' | 'con', index: number, subIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeGoalId || !activeGoal) return;
    const currentPoints = type === 'pro' ? [...(activeGoal.pros || [])] : [...(activeGoal.cons || [])];
    
    if (subIndex !== undefined) {
      const subs = [...(currentPoints[index].subPoints || [])];
      subs.splice(subIndex, 1);
      currentPoints[index] = { ...currentPoints[index], subPoints: subs };
    } else {
      currentPoints.splice(index, 1);
    }
    
    await updateDoc(doc(db, 'main_goals', activeGoalId), { [type === 'pro' ? 'pros' : 'cons']: currentPoints });
  };

  const handleDeleteGoal = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await deleteDoc(doc(db, 'main_goals', id));
      if (activeGoalId === id) {
        setActiveGoalId(goals.find(g => g.id !== id)?.id || null);
      }
    }
  };

  if (isLoading) return null;

  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <AnimatePresence mode="wait">
        {activeGoal && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Pros Column (Right) */}
            <div 
              className="no-scrollbar"
              style={{
                position: 'absolute',
                right: '-420px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '70vh',
                width: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                alignItems: 'flex-start',
                padding: '40px 20px',
                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
              }}
            >
              <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              <AnimatePresence>
                {(activeGoal.pros || []).map((pro, idx) => (
                  <motion.div
                    key={`pro-${idx}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{ width: '100%' }}
                  >
                    <div 
                      onClick={() => {
                        setEditingPoint({ type: 'pro', index: idx });
                        setPointValue(pro.text);
                      }}
                      onContextMenu={(e) => handleDeletePoint(e, 'pro', idx)}
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(76, 175, 80, 0.05)',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        borderRadius: '20px',
                        color: '#a5d6a7',
                        fontSize: '14px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {editingPoint?.type === 'pro' && editingPoint.index === idx && editingPoint.subIndex === undefined ? (
                          <input
                            autoFocus
                            value={pointValue}
                            onChange={(e) => setPointValue(e.target.value)}
                            onBlur={handleSavePoint}
                            onKeyDown={(e) => e.key === 'Enter' && handleSavePoint()}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                          />
                        ) : pro.text || 'New Pro...'}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: 90 }}
                        onClick={(e) => handleAddSubPoint(e, 'pro', idx)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(76, 175, 80, 0.2)',
                          border: 'none',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} />
                      </motion.button>
                    </div>

                    {/* Sub-points */}
                    <div style={{ marginLeft: '24px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(pro.subPoints || []).map((sub, sIdx) => {
                        const subText = typeof sub === 'string' ? sub : (sub as any).text || '';
                        return (
                          <motion.div
                            key={`pro-${idx}-sub-${sIdx}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onContextMenu={(e) => handleDeletePoint(e, 'pro', idx, sIdx)}
                            onClick={() => {
                              setEditingPoint({ type: 'pro', index: idx, subIndex: sIdx });
                              setPointValue(subText);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(76, 175, 80, 0.03)',
                              border: '1px solid rgba(76, 175, 80, 0.1)',
                              borderRadius: '12px',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {editingPoint?.type === 'pro' && editingPoint.index === idx && editingPoint.subIndex === sIdx ? (
                              <input
                                autoFocus
                                value={pointValue}
                                onChange={(e) => setPointValue(e.target.value)}
                                onBlur={handleSavePoint}
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePoint()}
                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                              />
                            ) : subText || '...'}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Cons Column (Left) */}
            <div 
              className="no-scrollbar"
              style={{
                position: 'absolute',
                left: '-420px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '70vh',
                width: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                alignItems: 'flex-end',
                padding: '40px 20px',
                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
              }}
            >
              <AnimatePresence>
                {(activeGoal.cons || []).map((con, idx) => (
                  <motion.div
                    key={`con-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{ width: '100%' }}
                  >
                    <div 
                      onClick={() => {
                        setEditingPoint({ type: 'con', index: idx });
                        setPointValue(con.text);
                      }}
                      onContextMenu={(e) => handleDeletePoint(e, 'con', idx)}
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(255, 82, 82, 0.05)',
                        border: '1px solid rgba(255, 82, 82, 0.2)',
                        borderRadius: '20px',
                        color: '#ef9a9a',
                        fontSize: '14px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        textAlign: 'right',
                        flexDirection: 'row-reverse'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {editingPoint?.type === 'con' && editingPoint.index === idx && editingPoint.subIndex === undefined ? (
                          <input
                            autoFocus
                            value={pointValue}
                            onChange={(e) => setPointValue(e.target.value)}
                            onBlur={handleSavePoint}
                            onKeyDown={(e) => e.key === 'Enter' && handleSavePoint()}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', textAlign: 'right' }}
                          />
                        ) : con.text || 'New Con...'}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: -90 }}
                        onClick={(e) => handleAddSubPoint(e, 'con', idx)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(255, 82, 82, 0.2)',
                          border: 'none',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} />
                      </motion.button>
                    </div>

                    {/* Sub-points */}
                    <div style={{ marginRight: '24px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      {(con.subPoints || []).map((sub, sIdx) => {
                        const subText = typeof sub === 'string' ? sub : (sub as any).text || '';
                        return (
                          <motion.div
                            key={`con-${idx}-sub-${sIdx}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onContextMenu={(e) => handleDeletePoint(e, 'con', idx, sIdx)}
                            onClick={() => {
                              setEditingPoint({ type: 'con', index: idx, subIndex: sIdx });
                              setPointValue(subText);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(255, 82, 82, 0.03)',
                              border: '1px solid rgba(255, 82, 82, 0.1)',
                              borderRadius: '12px',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textAlign: 'right'
                            }}
                          >
                            {editingPoint?.type === 'con' && editingPoint.index === idx && editingPoint.subIndex === sIdx ? (
                              <input
                                autoFocus
                                value={pointValue}
                                onChange={(e) => setPointValue(e.target.value)}
                                onBlur={handleSavePoint}
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePoint()}
                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', textAlign: 'right' }}
                              />
                            ) : subText || '...'}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {!isEditing ? (
              <motion.div
                key={activeGoal.id + "-display"}
                initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.1, rotateY: 10 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsEditing(true)}
                style={{
                  width: 'min(500px, 70vh)',
                  height: 'min(500px, 70vh)',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '40px',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {/* Side Plus Buttons */}
                <motion.button
                  whileHover={{ scale: 1.2, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); handleAddPoint('con'); }}
                  style={{
                    position: 'absolute',
                    left: 'min(-60px, -10%)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(255, 82, 82, 0.1)',
                    border: '1px solid rgba(255, 82, 82, 0.3)',
                    color: '#ff5252',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 20px rgba(255, 82, 82, 0.2)'
                  }}
                >
                  <Plus size={28} strokeWidth={3} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.2, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); handleAddPoint('pro'); }}
                  style={{
                    position: 'absolute',
                    right: 'min(-60px, -10%)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    color: '#4caf50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)'
                  }}
                >
                  <Plus size={28} strokeWidth={3} />
                </motion.button>

                {/* Ambient Background Glow */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle at center, rgba(124, 77, 255, 0.15) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />

                <Target size={40} color="#7c4dff" style={{ marginBottom: '20px', opacity: 0.8 }} />
                
                <h2 style={{ 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  color: 'rgba(255,255,255,0.3)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '4px',
                  marginBottom: '12px'
                }}>
                  Target #{goals.findIndex(g => g.id === activeGoal.id) + 1}
                </h2>

                <p style={{ 
                  fontSize: 'min(28px, 4vh)', 
                  fontWeight: 600, 
                  color: activeGoal.text ? 'white' : 'rgba(255,255,255,0.2)',
                  lineHeight: '1.4',
                  maxWidth: '100%',
                  margin: 0,
                  textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  {activeGoal.text || 'Define your focus...'}
                </p>

                <motion.div 
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  style={{ 
                    marginTop: '24px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Click to edit goal
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key={activeGoal.id + "-edit"}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  width: 'min(500px, 70vh)',
                  height: 'min(500px, 70vh)',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(60px)',
                  border: '2px solid rgba(124, 77, 255, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  boxShadow: '0 0 100px rgba(124, 77, 255, 0.2)',
                }}
              >
                <textarea
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Define your goal..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: 'min(28px, 4vh)',
                    fontWeight: 600,
                    textAlign: 'center',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: '1.4',
                    fontFamily: 'inherit'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSave();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setInputValue(activeGoal.text);
                    }
                  }}
                />
                
                <div style={{ 
                  marginTop: '32px', 
                  display: 'flex', 
                  gap: '16px',
                  alignItems: 'center' 
                }}>
                  <motion.button
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setIsEditing(false); setInputValue(activeGoal.text); }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, background: '#7c4dff', boxShadow: '0 0 20px rgba(124,77,255,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    style={{
                      padding: '10px 28px',
                      borderRadius: '12px',
                      background: '#6200ea',
                      border: 'none',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Update
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Goal Tabs / Indicators */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        display: 'flex',
        gap: '12px',
        background: 'rgba(255,255,255,0.03)',
        padding: '12px 20px',
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)'
      }}>
        {goals.map((g, idx) => (
          <div key={g.id} style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setActiveGoalId(g.id);
                setIsEditing(false);
              }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: activeGoalId === g.id ? '#7c4dff' : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: activeGoalId === g.id ? '0 0 15px rgba(124,77,255,0.4)' : 'none',
                transition: 'background 0.3s'
              }}
            >
              {idx + 1}
            </motion.button>
            
            {goals.length > 1 && activeGoalId === g.id && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => handleDeleteGoal(e, g.id)}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ff5252',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={10} />
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Floating Plus Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleNewGoal}
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c4dff 0%, #6200ea 100%)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(124, 77, 255, 0.4)',
          zIndex: 10
        }}
      >
        <Plus size={32} />
      </motion.button>
    </div>
  );
};

export default GoalView;
