import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  notes?: string;
}

interface ExpandedViewProps {
  bookmark: Bookmark;
  onClose: () => void;
  onSaveNotes: (notes: string) => void;
}

const ExpandedView: React.FC<ExpandedViewProps> = ({ bookmark, onClose, onSaveNotes }) => {
  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${new URL(bookmark.url).hostname}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      style={{ zIndex: 200 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${bookmark.id}`}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        className="glass"
        style={{
          width: '900px',
          maxWidth: '95%',
          height: '600px',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            zIndex: 10,
          }}
        >
          <X size={20} color="white" />
        </motion.button>

        {/* Left Side: Icon and Info */}
        <div style={{
          width: '35%',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}>
          <motion.div
            layoutId={`icon-container-${bookmark.id}`}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            style={{
              width: '120px',
              height: '120px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              padding: '20px',
            }}
          >
            <motion.img
              layoutId={`icon-${bookmark.id}`}
              src={faviconUrl}
              alt={bookmark.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ textAlign: 'center' }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
              {bookmark.title}
            </h2>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
              }}
            >
              {new URL(bookmark.url).hostname} <ExternalLink size={14} />
            </a>
          </motion.div>
        </div>

        {/* Right Side: Notepad */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            flex: 1,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>
              Quick Notes
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>

          <textarea
            autoFocus
            defaultValue={bookmark.notes || ''}
            onChange={(e) => onSaveNotes(e.target.value)}
            placeholder="Type your notes here..."
            className="notepad-textarea"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '18px',
              lineHeight: '1.6',
              resize: 'none',
              fontFamily: 'inherit',
            }}
          />
        </motion.div>
      </motion.div>

      <style>{`
        .notepad-textarea::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </motion.div>
  );
};

export default ExpandedView;
