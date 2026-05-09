import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface MainGoal {
  id: string;
  text: string;
  order: number;
}

const GoalView: React.FC = () => {
  const [goals, setGoals] = useState<MainGoal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'main_goals'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MainGoal));
      setGoals(goalsData);
      
      if (goalsData.length > 0 && !activeGoalId) {
        setActiveGoalId(goalsData[0].id);
      } else if (goalsData.length === 0 && !isLoading) {
        // Create initial goal if none exist
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
      createdAt: serverTimestamp()
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
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
      height: 'calc(100vh - 180px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      position: 'relative'
    }}>
      <AnimatePresence mode="wait">
        {activeGoal && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isEditing ? (
              <motion.div
                key={activeGoal.id + "-display"}
                initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.1, rotateY: 10 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsEditing(true)}
                style={{
                  width: '550px',
                  height: '550px',
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
                  padding: '60px',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {/* Side Plus Buttons */}
                <motion.button
                  whileHover={{ scale: 1.2, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); handleNewGoal(); }}
                  style={{
                    position: 'absolute',
                    left: '-80px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '60px',
                    height: '60px',
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
                  <Plus size={32} strokeWidth={3} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.2, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); handleNewGoal(); }}
                  style={{
                    position: 'absolute',
                    right: '-80px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '60px',
                    height: '60px',
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
                  <Plus size={32} strokeWidth={3} />
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

                <Target size={48} color="#7c4dff" style={{ marginBottom: '24px', opacity: 0.8 }} />
                
                <h2 style={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: 'rgba(255,255,255,0.3)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '4px',
                  marginBottom: '16px'
                }}>
                  Target #{goals.findIndex(g => g.id === activeGoal.id) + 1}
                </h2>

                <p style={{ 
                  fontSize: '32px', 
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
                    marginTop: '32px',
                    fontSize: '13px',
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
                  width: '550px',
                  height: '550px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(60px)',
                  border: '2px solid rgba(124, 77, 255, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px',
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
                    fontSize: '32px',
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
                  marginTop: '40px', 
                  display: 'flex', 
                  gap: '16px',
                  alignItems: 'center' 
                }}>
                  <motion.button
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setIsEditing(false); setInputValue(activeGoal.text); }}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '14px',
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
                      padding: '12px 32px',
                      borderRadius: '12px',
                      background: '#6200ea',
                      border: 'none',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle2 size={18} />
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
                onClick={(e) => handleDelete(e, g.id)}
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
