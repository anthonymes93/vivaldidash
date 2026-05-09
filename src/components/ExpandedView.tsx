import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import BookmarkIcon from './BookmarkIcon';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  notes?: string;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
}

interface ExpandedViewProps {
  bookmark: Bookmark;
  onClose: () => void;
  onSaveNotes: (notes: string) => void;
}

const AutoResizeTextarea = ({ value, onChange, placeholder, autoFocus }: { value: string, onChange: (val: string) => void, placeholder?: string, autoFocus?: boolean }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      rows={1}
      className="notepad-textarea"
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '18px',
        lineHeight: '1.6',
        resize: 'none',
        fontFamily: 'inherit',
        overflow: 'hidden',
        padding: 0,
      }}
    />
  );
};

const LinkPreviewCard = ({ url, onDelete }: { url: string, onDelete: () => void }) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.02)',
        padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '12px'
      }}>
        <div style={{ width: 24, height: 24, borderRadius: '4px', background: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '150px', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const title = data?.title || url;
  const publisher = data?.publisher || new URL(url).hostname;
  const logoUrl = data?.logo?.url;

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '12px',
        borderRadius: '12px',
        textDecoration: 'none',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '12px',
        transition: 'all 0.2s',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="logo" style={{ width: 24, height: 24, borderRadius: '4px', flexShrink: 0 }} />
      ) : (
        <ExternalLink size={20} opacity={0.5} style={{ flexShrink: 0 }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </span>
        <span style={{ fontSize: '11px', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{publisher}</span>
      </div>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          opacity: 0.6,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      >
        <X size={14} />
      </button>
    </a>
  );
};

const ExpandedView: React.FC<ExpandedViewProps> = ({ bookmark, onClose, onSaveNotes }) => {
  const [notes, setNotes] = React.useState(bookmark.notes || '');
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const blocks = notes.split(urlRegex);

  const handleBlockChange = (index: number, newValue: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = newValue;
    const newNotes = newBlocks.join('');
    setNotes(newNotes);
    onSaveNotes(newNotes);
  };

  const handleLinkDelete = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks[index] = ''; // Remove the URL
    const newNotes = newBlocks.join('');
    setNotes(newNotes);
    onSaveNotes(newNotes);
  };
  
  let displayHostname = '';
  if (bookmark.url) {
    try {
      displayHostname = new URL(bookmark.url).hostname;
    } catch (e) {
      displayHostname = 'local shortcut';
    }
  } else {
    displayHostname = 'folder';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      style={{ zIndex: 10000 }}
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
            <BookmarkIcon 
              title={bookmark.title}
              url={bookmark.url}
              iconType={bookmark.iconType}
              lucideIcon={bookmark.lucideIcon}
              iconColor={bookmark.iconColor}
              customIconUrl={bookmark.customIconUrl}
              size={80}
              noBackground={true}
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
              {displayHostname} <ExternalLink size={14} />
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

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
            {blocks.map((block, index) => {
              if (block.match(urlRegex)) {
                return (
                  <div key={index} style={{ margin: '8px 0' }}>
                    <LinkPreviewCard url={block} onDelete={() => handleLinkDelete(index)} />
                  </div>
                );
              }
              // Skip empty text blocks unless it's the very last one (to allow typing at the end)
              if (block === '' && index !== blocks.length - 1 && index !== 0) return null;

              return (
                <AutoResizeTextarea
                  key={index}
                  value={block}
                  onChange={(val) => handleBlockChange(index, val)}
                  placeholder={blocks.length === 1 ? "Type your notes here..." : ""}
                  autoFocus={index === blocks.length - 1}
                />
              );
            })}
          </div>
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
