import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import BookmarkIcon from './BookmarkIcon';

interface BookmarkCardProps {
  id: string;
  title: string;
  url: string;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  hideTitle?: boolean;
  noBackground?: boolean;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
  isDashboardWidget?: boolean;
  isFullCover?: boolean;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
  id, title, url, onContextMenu, onClick, size = 120, hideTitle = false, noBackground = false,
  iconType, lucideIcon, iconColor, customIconUrl, isDashboardWidget, isFullCover 
}) => {
  const scale = size / 120;

  return (
    <motion.div
      layoutId={`card-${id}`}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      whileHover={{ 
        y: (noBackground || isFullCover) ? -15 : -5, 
        scale: (noBackground || isFullCover) ? 1.4 : 1.1,
        zIndex: 100 
      }}
      className={noBackground ? "" : "glass-card bookmark-card"}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: (noBackground || isFullCover) ? '0' : `${16 * scale}px`,
        cursor: 'pointer',
        background: noBackground ? 'transparent' : undefined,
        border: (noBackground || isFullCover) ? 'none' : undefined,
        backdropFilter: (noBackground || isFullCover) ? 'none' : undefined,
        overflow: 'hidden',
        borderRadius: `${24 * scale}px`,
      }}
      onClick={(e) => onClick(e)}
      onContextMenu={(e) => onContextMenu(e, id)}
    >
      {isDashboardWidget && (
        <div style={{
          position: 'absolute',
          top: `${8 * scale}px`,
          left: `${8 * scale}px`,
          opacity: 0.4,
          color: 'white',
        }}>
          <LayoutDashboard size={12 * scale} />
        </div>
      )}
      <motion.div
        layoutId={`icon-container-${id}`}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        style={{
          width: (noBackground || isFullCover) ? '100%' : `${48 * scale}px`,
          height: (noBackground || isFullCover) ? '100%' : `${48 * scale}px`,
          marginBottom: (hideTitle || noBackground || isFullCover) ? 0 : `${12 * scale}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (noBackground || isFullCover) ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: isFullCover ? '0' : `${12 * scale}px`,
        }}
      >
        <BookmarkIcon 
          title={title}
          url={url}
          iconType={iconType}
          lucideIcon={lucideIcon}
          iconColor={iconColor}
          customIconUrl={customIconUrl}
          size={(noBackground || isFullCover) ? size : 48 * scale}
          noBackground={true}
        />
      </motion.div>
 
      {!hideTitle && !isFullCover && (
        <span
          style={{
            fontSize: `${13 * scale}px`,
            fontWeight: 400,
            textAlign: 'center',
            width: '100%',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {title}
        </span>
      )}
    </motion.div>
  );
};

export default BookmarkCard;
