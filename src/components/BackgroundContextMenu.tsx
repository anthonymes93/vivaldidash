import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Plus, Settings } from 'lucide-react';

interface BackgroundContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onUnhideClick: () => void;
  onAddBookmark: () => void;
  onOpenSettings: () => void;
}

const BackgroundContextMenu: React.FC<BackgroundContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  onUnhideClick,
  onAddBookmark,
  onOpenSettings,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      
      let newLeft = x;
      let newTop = y;

      if (x + rect.width > winW) newLeft = Math.max(8, winW - rect.width - 8);
      if (y + rect.height > winH) newTop = Math.max(8, winH - rect.height - 8);

      setPos({ left: newLeft, top: newTop });
    }
  }, [x, y, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            position: 'fixed',
            left: pos.left,
            top: pos.top,
            zIndex: 1000,
            background: 'rgba(20, 20, 25, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '8px',
            width: '200px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}
        >
          <div className="bg-menu-item" onClick={() => { onUnhideClick(); onClose(); }}>
            <Eye size={16} />
            <span>Restore Hidden Items</span>
          </div>
          <div className="bg-menu-item" onClick={() => { onAddBookmark(); onClose(); }}>
            <Plus size={16} />
            <span>Add New Icon</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />
          <div className="bg-menu-item" onClick={() => { onOpenSettings(); onClose(); }}>
            <Settings size={16} />
            <span>Dashboard Settings</span>
          </div>

          <style>{`
            .bg-menu-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
              transition: all 0.2s;
            }
            .bg-menu-item:hover {
              background: rgba(255, 255, 255, 0.08);
              color: white;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackgroundContextMenu;
