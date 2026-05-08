import React from 'react';
import { motion } from 'framer-motion';

import BookmarkIcon from './BookmarkIcon';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
}

interface FolderCardProps {
  id: string;
  title: string;
  children: Bookmark[];
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
  size?: number;
}

const FolderCard: React.FC<FolderCardProps> = ({ id, children, onContextMenu, onClick, size = 120 }) => {
  const scale = size / 120;
  return (
    <motion.div
      layoutId={`card-${id}`}
      transition={{ type: 'spring', damping: 25, stiffness: 150 }}
      whileHover={{ y: -5 * scale }}
      className="glass-card folder-card"
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${8 * scale}px`,
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: `${24 * scale}px`,
        backdropFilter: 'blur(20px)',
      }}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, id)}
    >
      <div style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: `${4 * scale}px`,
        padding: `${4 * scale}px`,
      }}>
        {children.slice(0, 4).map((child) => (
          <div key={child.id} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: `${4 * scale}px`,
            overflow: 'hidden'
          }}>
            <BookmarkIcon 
              title={child.title} 
              url={child.url} 
              iconType={child.iconType}
              lucideIcon={child.lucideIcon}
              iconColor={child.iconColor}
              customIconUrl={child.customIconUrl}
              size={24 * scale} 
              noBackground 
            />
            <span style={{ 
              fontSize: `${10 * scale}px`, 
              opacity: 0.6, 
              width: '100%', 
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              color: 'white'
            }}>
              {child.title}
            </span>
          </div>
        ))}
        {/* Placeholder if less than 4 */}
        {Array.from({ length: Math.max(0, 4 - children.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: `${24 * scale}px`, height: `${24 * scale}px`, background: 'rgba(255,255,255,0.02)', borderRadius: `${4 * scale}px` }} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FolderCard;
