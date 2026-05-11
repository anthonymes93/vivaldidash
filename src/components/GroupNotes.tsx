import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Save, Check, Star } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import BookmarkIcon from './BookmarkIcon';

interface Bookmark {
  title: string;
  url: string;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
  useCoverIcon?: boolean;
}

interface GroupNotesProps {
  folderId: string;
  notes: string;
  onUpdate: (notes: string) => void;
  folder?: Bookmark;
}

const GroupNotes: React.FC<GroupNotesProps> = ({ folderId, notes, onUpdate, folder }) => {
  const [localNotes, setLocalNotes] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes, folderId]);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(localNotes);
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selection = textareaRef.current.value.substring(start, end).trim();

    if (selection) {
      e.preventDefault();
      const rect = textareaRef.current.getBoundingClientRect();
      setContextMenu({ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top, 
        text: selection 
      });
    }
  };

  const setPriorityText = async () => {
    if (contextMenu) {
      await updateDoc(doc(db, 'bookmarks', folderId), { 
        priorityText: contextMenu.text 
      });
      setContextMenu(null);
      // Brief visual feedback could go here
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-card"
      style={{
        width: '320px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minHeight: '400px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {folder?.useCoverIcon ? (
          <BookmarkIcon 
            title={folder.title || ''}
            url={folder.url || ''}
            iconType={folder.iconType}
            lucideIcon={folder.lucideIcon}
            iconColor={folder.iconColor}
            customIconUrl={folder.customIconUrl}
            size={80}
          />
        ) : (
          <div style={{ 
            padding: '10px', 
            background: 'rgba(124, 77, 255, 0.15)', 
            borderRadius: '12px',
            color: '#7c4dff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px'
          }}>
            <StickyNote size={20} />
          </div>
        )}
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'white' }}>Group Notes</h3>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <textarea
          ref={textareaRef}
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onContextMenu={handleContextMenu}
          placeholder="Type notes for this group..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px',
            color: 'white',
            fontSize: '14px',
            lineHeight: '1.6',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            minHeight: '250px'
          }}
        />

        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'absolute',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 1000,
                background: 'rgba(20, 20, 25, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                minWidth: '180px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={setPriorityText}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Star size={14} color="#ffd02f" />
                Set as Priority Text
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          Tip: Highlight text & right-click
        </span>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: showSaved ? '#4caf50' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.3s ease'
          }}
        >
          {showSaved ? (
            <>
              <Check size={16} />
              Saved
            </>
          ) : (
            <>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default GroupNotes;
