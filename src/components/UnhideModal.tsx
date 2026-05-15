import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Trash2 } from 'lucide-react';

interface UnhideModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenItems: any[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

const UnhideModal: React.FC<UnhideModalProps> = ({
  isOpen,
  onClose,
  hiddenItems,
  onRestore,
  onDelete,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: 'relative',
              width: 'min(600px, 100%)',
              maxHeight: '80vh',
              background: 'rgba(20, 20, 25, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'white', margin: 0 }}>Hidden Items</h2>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {hiddenItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
                  No hidden items found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {hiddenItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}>
                          {item.type === 'folder' ? '📁' : '🔗'}
                        </div>
                        <div>
                          <div style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{item.title}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{item.url || 'Group Folder'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => onRestore(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(124, 77, 255, 0.1)',
                            color: '#7c4dff',
                            border: '1px solid rgba(124, 77, 255, 0.2)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Eye size={14} />
                          Restore
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          style={{
                            background: 'rgba(255, 59, 48, 0.1)',
                            color: '#ff3b30',
                            border: '1px solid rgba(255, 59, 48, 0.2)',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UnhideModal;
