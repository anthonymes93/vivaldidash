import React from 'react';
import { Plus, LayoutDashboard, Calendar, Settings as SettingsIcon, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';

const PAGES = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'calendar', name: 'Calendar', icon: <Calendar size={18} /> },
  { id: 'whiteboard', name: 'Whiteboard', icon: <PenTool size={18} /> },
];

interface TopBarProps {
  onAddClick: () => void;
  onSettingsClick: () => void;
  activePage: string;
  onPageChange: (page: string) => void;
  isDragging: boolean;
}

function DroppableMenuItem({
  page,
  activePage,
  onPageChange,
  isDragging,
}: {
  page: { id: string; name: string; icon: React.ReactNode };
  activePage: string;
  onPageChange: (id: string) => void;
  isDragging: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: page.id });
  const isActive = activePage === page.id;

  return (
    <motion.div
      ref={setNodeRef}
      onClick={() => onPageChange(page.id)}
      animate={{
        color: isActive ? 'rgba(255,255,255,1)' : isOver ? 'rgba(124,77,255,1)' : 'rgba(255,255,255,0.55)',
        background: isOver
          ? 'rgba(124,77,255,0.25)'
          : 'transparent',
        scale: isOver && isDragging ? 1.08 : 1,
      }}
      transition={{ duration: 0.15 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        padding: '6px 14px',
        borderRadius: '10px',
        border: isOver && isDragging
          ? '1.5px solid rgba(124,77,255,0.7)'
          : '1.5px solid transparent',
        position: 'relative',
      }}
    >
      {page.icon}
      <span>{page.name}</span>

      {/* Active underline */}
      {isActive && (
        <motion.div
          layoutId="active-page-indicator"
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '14px',
            right: '14px',
            height: '2px',
            background: 'white',
            borderRadius: '2px',
          }}
        />
      )}

      {/* Drop hint label */}
      {isOver && isDragging && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: '11px',
            background: 'rgba(124,77,255,0.9)',
            color: 'white',
            padding: '3px 10px',
            borderRadius: '6px',
            letterSpacing: '0.5px',
            pointerEvents: 'none',
          }}
        >
          Move to {page.name}
        </motion.div>
      )}
    </motion.div>
  );
}

const TopBar: React.FC<TopBarProps> = ({
  onAddClick,
  onSettingsClick,
  activePage,
  onPageChange,
  isDragging,
}) => {
  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '64px',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      {/* Left: Settings */}
      <motion.button
        whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.1)' }}
        whileTap={{ scale: 0.9 }}
        onClick={onSettingsClick}
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'white',
        }}
      >
        <SettingsIcon size={20} />
      </motion.button>

      {/* Center: Page tabs (droppable) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
        {PAGES.map((page) => (
          <DroppableMenuItem
            key={page.id}
            page={page}
            activePage={activePage}
            onPageChange={onPageChange}
            isDragging={isDragging}
          />
        ))}
      </div>

      {/* Right: Add */}
      <motion.button
        whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.1)' }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddClick}
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'white',
        }}
      >
        <Plus size={24} />
      </motion.button>
    </motion.div>
  );
};

export default TopBar;
