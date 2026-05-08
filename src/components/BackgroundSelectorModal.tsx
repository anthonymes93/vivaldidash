import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';

interface BackgroundSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgrounds: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}

const BackgroundSelectorModal: React.FC<BackgroundSelectorModalProps> = ({
  isOpen,
  onClose,
  backgrounds,
  currentIndex,
  onSelect,
  onHover
}) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const getThumbnail = (bg: string) => {
    if (bg.startsWith('youtube:')) {
      const id = bg.split(':')[1];
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    return bg;
  };

  const handleClose = () => {
    onHover(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="glass modal-content"
            style={{ width: '800px', maxWidth: '95%', padding: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                Choose Background
              </h2>
              <button 
                onClick={handleClose}
                className="control-btn"
                style={{ padding: '8px' }}
              >
                <X size={24} color="rgba(255, 255, 255, 0.5)" />
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '20px',
              maxHeight: '60vh',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {backgrounds.map((bg, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                    onHover(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    onHover(null);
                  }}
                  onClick={() => {
                    onSelect(index);
                    handleClose();
                  }}
                  style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: index === currentIndex 
                      ? '3px solid #7c4dff' 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: index === currentIndex 
                      ? '0 0 20px rgba(124, 77, 255, 0.4)' 
                      : 'none',
                    transition: 'border-color 0.2s'
                  }}
                >
                  {bg.startsWith('youtube:') && hoveredIndex === index ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${bg.split(':')[1]}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        pointerEvents: 'none',
                        transform: 'scale(1.5)', // Zoom in slightly to hide black bars in thumbnail
                      }}
                      title="Video Preview"
                    />
                  ) : (
                    <img
                      src={getThumbnail(bg)}
                      alt={`Background ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: index === currentIndex || hoveredIndex === index ? 1 : 0.7,
                        transition: 'opacity 0.3s'
                      }}
                    />
                  )}
                  
                  {bg.startsWith('youtube:') && hoveredIndex !== index && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'white',
                      backdropFilter: 'blur(4px)'
                    }}>
                      <Play size={10} fill="white" /> VIDEO
                    </div>
                  )}

                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 500,
                    opacity: index === currentIndex ? 1 : 0.8
                  }}>
                    {bg.startsWith('youtube:') ? 'Cinematic Lo-Fi' : `Aesthetic Scene ${index + 1}`}
                  </div>

                  {index === currentIndex && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: '#7c4dff',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 800,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}>
                      ACTIVE
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BackgroundSelectorModal;
