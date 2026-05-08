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
  hideTitle?: boolean;
}

const FolderCard: React.FC<FolderCardProps> = ({ id, title, children, onContextMenu, onClick, size = 120, hideTitle = false }) => {
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
        gridTemplateColumns: `repeat(${Math.max(2, Math.ceil(Math.sqrt(children.length)))}, 1fr)`,
        gridTemplateRows: `repeat(${Math.max(2, Math.ceil(Math.sqrt(children.length)))}, 1fr)`,
        gap: `${2 * scale}px`,
        padding: `${4 * scale}px`,
        paddingBottom: hideTitle ? `${4 * scale}px` : `${16 * scale}px`,
      }}>
        {children.map((child) => {
          const cols = Math.max(2, Math.ceil(Math.sqrt(children.length)));
          const internalScale = scale * (2.5 / cols); // Increased factor for bigger icons
          return (
            <div key={child.id} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: `${2 * internalScale}px`,
              overflow: 'hidden'
            }}>
              <BookmarkIcon 
                title={child.title} 
                url={child.url} 
                iconType={child.iconType}
                lucideIcon={child.lucideIcon}
                iconColor={child.iconColor}
                customIconUrl={child.customIconUrl}
                size={32 * internalScale} 
                noBackground 
              />
              <span style={{ 
                fontSize: `${11 * internalScale}px`, 
                opacity: 0.7, 
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
          );
        })}
        {/* Placeholder if less than 4 to keep the 2x2 shape */}
        {Array.from({ length: Math.max(0, 4 - children.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: `${32 * scale}px`, height: `${32 * scale}px`, background: 'rgba(255,255,255,0.02)', borderRadius: `${4 * scale}px` }} />
          </div>
        ))}
      </div>

      {!hideTitle && (
        <span
          style={{
            position: 'absolute',
            bottom: `${4 * scale}px`,
            left: 0,
            right: 0,
            fontSize: `${11 * scale}px`,
            fontWeight: 500,
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'rgba(255, 255, 255, 0.8)',
            padding: `0 ${8 * scale}px`,
          }}
        >
          {title}
        </span>
      )}
    </motion.div>
  );
};

export default FolderCard;
