import React from 'react';
import { motion } from 'framer-motion';

interface BookmarkCardProps {
  id: string;
  title: string;
  url: string;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
  size?: number;
  hideTitle?: boolean;
  noBackground?: boolean;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ id, title, url, onContextMenu, onClick, size = 120, hideTitle = false, noBackground = false }) => {
  let faviconUrl = '';
  try {
    const urlStr = url || '';
    const fullUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const domain = new URL(fullUrl).hostname;
    faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch (e) {
    faviconUrl = `https://ui-avatars.com/api/?name=${title}&background=random`;
  }

  const scale = size / 120;

  return (
    <motion.div
      layoutId={`card-${id}`}
      transition={{ type: 'spring', damping: 25, stiffness: 150 }}
      whileHover={{ y: -5 * scale }}
      className={noBackground ? "" : "glass-card bookmark-card"}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: noBackground ? '0' : `${16 * scale}px`,
        cursor: 'pointer',
        background: noBackground ? 'transparent' : undefined,
        border: noBackground ? 'none' : undefined,
        backdropFilter: noBackground ? 'none' : undefined,
      }}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, id)}
    >
      <motion.div
        layoutId={`icon-container-${id}`}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        style={{
          width: noBackground ? '100%' : `${48 * scale}px`,
          height: noBackground ? '100%' : `${48 * scale}px`,
          marginBottom: (hideTitle || noBackground) ? 0 : `${12 * scale}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: noBackground ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: `${12 * scale}px`,
          padding: noBackground ? '0' : `${10 * scale}px`,
        }}
      >
        <motion.img
          layoutId={`icon-${id}`}
          src={faviconUrl}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${title}&background=random`;
          }}
        />
      </motion.div>
 
      {!hideTitle && (
        <span
          style={{
            fontSize: `${13 * scale}px`,
            fontWeight: 400,
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
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
