import React, { useState } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Calendar, 
  Settings as SettingsIcon, 
  PenTool, 
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Search,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';

interface TopBarProps {
  onAddClick: () => void;
  onSettingsClick: () => void;
  activePage: string;
  onPageChange: (page: string) => void;
  isDragging: boolean;
}

const PAGES = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'calendar', name: 'Calendar', icon: <Calendar size={18} /> },
  { id: 'habits', name: 'Habits', icon: <TrendingUp size={18} /> },
  { id: 'whiteboard', name: 'Whiteboard', icon: <PenTool size={18} /> },
  { id: 'goal', name: 'Main Goal', icon: <Target size={18} /> },
];

const MEGA_MENU_ITEMS = {
  navigation: [
    { name: 'Global Search', icon: <Search size={18} />, desc: 'Find anything instantly across your workspaces' },
    { name: 'Smart Folders', icon: <Sparkles size={18} />, desc: 'AI-powered organization for your growing collection' },
    { name: 'Quick Access', icon: <Zap size={18} />, desc: 'Your most frequently visited sites, pinned' },
  ],
  analytics: [
    { label: 'Total Clicks', value: '1,248', trend: '+12.5% this week' },
    { label: 'System Uptime', value: '99.98%', trend: 'Operational' },
  ],
  recent: [
    { name: 'Developer Documentation', time: '2 minutes ago' },
    { name: 'Marketing Dashboard 2024', time: '15 minutes ago' },
    { name: 'Product Roadmap & Vision', time: '1 hour ago' },
    { name: 'Client Feedback Portal', time: '3 hours ago' },
  ]
};

function MegaMenu() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        margin: '0 auto',
        width: 'min(900px, 92%)',
        background: 'rgba(13, 13, 18, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 40px 100px rgba(0, 0, 0, 0.8)',
        padding: '40px',
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr 1fr',
        gap: '48px',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      {/* Column 1: Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Platform Navigation
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MEGA_MENU_ITEMS.navigation.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ x: 8, background: 'rgba(255,255,255,0.04)' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '12px 16px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '14px', 
                background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.2), rgba(124, 77, 255, 0.05))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#9d7aff',
                border: '1px solid rgba(124, 77, 255, 0.2)'
              }}>
                {item.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>{item.name}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>{item.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Column 2: Analytics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Workspace Insights
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {MEGA_MENU_ITEMS.analytics.map((item) => (
            <div key={item.label} style={{ 
              padding: '24px', 
              borderRadius: '24px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'white', letterSpacing: '-1px' }}>{item.value}</span>
                <span style={{ fontSize: '12px', color: item.trend.includes('+') ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>{item.trend}</span>
              </div>
            </div>
          ))}
          <motion.div 
            whileHover={{ scale: 1.02, background: 'rgba(124, 77, 255, 0.15)' }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              marginTop: '8px', 
              padding: '16px', 
              borderRadius: '16px', 
              background: 'rgba(124, 77, 255, 0.1)', 
              border: '1px solid rgba(124, 77, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '10px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <TrendingUp size={18} color="#9d7aff" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#9d7aff' }}>Analyze Performance</span>
          </motion.div>
        </div>
      </div>

      {/* Column 3: Recent */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Recent Activity
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MEGA_MENU_ITEMS.recent.map((item) => (
            <motion.div 
              key={item.name} 
              whileHover={{ x: 4 }}
              style={{ padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#7c4dff' }} />
                {item.time}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            <Shield size={16} />
            <span style={{ fontWeight: 500 }}>Advanced Security Active</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DroppableMenuItem({
  page,
  activePage,
  onPageChange,
  isDragging,
  onHover,
}: {
  page: { id: string; name: string; icon: React.ReactNode };
  activePage: string;
  onPageChange: (id: string) => void;
  isDragging: boolean;
  onHover: (id: string | null) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: page.id });
  const isActive = activePage === page.id;

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => onHover(page.id)}
    >
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
        whileHover={{ background: 'rgba(255,255,255,0.05)' }}
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
        {window.innerWidth > 600 && <span>{page.name}</span>}

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
    </div>
  );
}

const TopBar: React.FC<TopBarProps> = ({
  onAddClick,
  onSettingsClick,
  activePage,
  onPageChange,
  isDragging,
}) => {
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const showMegaMenu = hoveredPageId === 'dashboard' && !isDragging;

  return (
    <motion.div
      onMouseLeave={() => setHoveredPageId(null)}
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
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: window.innerWidth < 600 ? '0 12px' : '0 24px',
        overflowX: window.innerWidth < 600 ? 'auto' : 'visible',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        gap: '12px'
      }} className="hide-scrollbar">
        {/* Left: Settings */}
        <motion.button
          whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={onSettingsClick}
          style={{
            width: '40px',
            height: '40px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <SettingsIcon size={20} />
        </motion.button>

        {/* Center: Page tabs (droppable) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          position: 'relative',
          flexShrink: 0 
        }}>
          {PAGES.map((page) => (
            <DroppableMenuItem
              key={page.id}
              page={page}
              activePage={activePage}
              onPageChange={onPageChange}
              isDragging={isDragging}
              onHover={setHoveredPageId}
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
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={24} />
        </motion.button>
      </div>

      <AnimatePresence>
        {showMegaMenu && <MegaMenu />}
      </AnimatePresence>
    </motion.div>
  );
};

export default TopBar;
