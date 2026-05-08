import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Trash, Upload, Youtube, Plus } from 'lucide-react';

interface BackgroundSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgrounds: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  onDelete?: (index: number) => void;
  onAdd?: (bg: string) => void;
}

const BackgroundSelectorModal: React.FC<BackgroundSelectorModalProps> = ({
  isOpen,
  onClose,
  backgrounds,
  currentIndex,
  onSelect,
  onHover,
  onDelete,
  onAdd
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const getThumbnail = (bg: string) => {
    if (bg.startsWith('youtube:')) {
      const id = bg.split(':')[1];
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    return bg;
  };

  const handleClose = () => {
    onHover(null);
    setYoutubeUrl('');
    setIsAddingYoutube(false);
    onClose();
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAdd) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress JPEG to 80% quality
          onAdd(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl || !onAdd) return;
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
      onAdd(`youtube:${videoId}`);
      setYoutubeUrl('');
      setIsAddingYoutube(false);
    } else {
      alert("Invalid YouTube URL. Please make sure it contains a valid video ID.");
    }
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
              <div style={{ display: 'flex', gap: '8px' }}>
                {onAdd && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <AnimatePresence>
                      {isAddingYoutube && (
                        <motion.form 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: '200px' }}
                          exit={{ opacity: 0, width: 0 }}
                          onSubmit={handleAddYoutube}
                          style={{ display: 'flex', gap: '4px' }}
                        >
                          <input
                            type="text"
                            placeholder="Paste YouTube Link"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="text-input"
                            style={{ width: '100%', fontSize: '12px', padding: '6px 12px' }}
                            autoFocus
                          />
                          <button type="submit" className="control-btn" style={{ padding: '6px' }}>
                            <Plus size={16} color="white" />
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>
                    
                    {!isAddingYoutube && (
                      <button 
                        onClick={() => setIsAddingYoutube(true)}
                        className="control-btn"
                        style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        title="Add YouTube Video"
                      >
                        <Youtube size={16} color="#ff0000" />
                        <span style={{ color: 'white' }}>Link</span>
                      </button>
                    )}

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="control-btn"
                      style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                      title="Upload Photo"
                    >
                      <Upload size={16} color="white" />
                      <span style={{ color: 'white' }}>Upload</span>
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                  </div>
                )}

                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                <button 
                  onClick={handleClose}
                  className="control-btn"
                  style={{ padding: '8px' }}
                >
                  <X size={24} color="rgba(255, 255, 255, 0.5)" />
                </button>
              </div>
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
                  key={`${index}-${bg.substring(0, 20)}`}
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
                  onContextMenu={(e) => handleContextMenu(e, index)}
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
                        transform: 'scale(1.5)', 
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

            {/* Context Menu */}
            {contextMenu && onDelete && (
              <div
                style={{
                  position: 'fixed',
                  top: contextMenu.y,
                  left: contextMenu.x,
                  background: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '8px',
                  zIndex: 10000,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onDelete(contextMenu.index);
                    setContextMenu(null);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', background: 'transparent', border: 'none',
                    color: '#ff6b6b', cursor: 'pointer', borderRadius: '6px',
                    width: '100%', fontSize: '14px', fontWeight: 500,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash size={16} /> Delete Photo
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BackgroundSelectorModal;
