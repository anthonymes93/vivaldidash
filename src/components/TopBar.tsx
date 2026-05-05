import React from 'react';
import { Plus, LayoutDashboard, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  onAddClick: () => void;
  onSettingsClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onAddClick, onSettingsClick }) => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Calendar', icon: <Calendar size={18} /> },
  ];

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
      }}
    >
      {/* Left Action: Settings */}
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

      {/* Centered Menu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
      }}>
        {menuItems.map((item) => (
          <div
            key={item.name}
            className="top-bar-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Right Actions: Add */}
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

      <style>{`
        .top-bar-item:hover {
          color: white !important;
          transform: translateY(-1px);
        }
      `}</style>
    </motion.div>
  );
};

export default TopBar;
