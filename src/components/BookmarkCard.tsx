import React from 'react';
import { motion } from 'framer-motion';

interface BookmarkCardProps {
  id: string;
  title: string;
  url: string;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ id, title, url, onContextMenu, onClick }) => {
  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`;

  return (
    <motion.div
      layoutId={`card-${id}`}
      transition={{ type: 'spring', damping: 25, stiffness: 150 }}
      whileHover={{ y: -5 }}
      className="glass-card bookmark-card"
      style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        cursor: 'pointer',
      }}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, id)}
    >
      <motion.div
        layoutId={`icon-container-${id}`}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        style={{
          width: '48px',
          height: '48px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '10px',
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

      <span
        style={{
          fontSize: '13px',
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
    </motion.div>
  );
};

export default BookmarkCard;
