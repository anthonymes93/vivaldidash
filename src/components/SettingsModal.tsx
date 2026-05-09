import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridColumns: number;
  onGridColumnsChange: (cols: number) => void;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  gridColumns, 
  onGridColumnsChange,
  workspaces = [],
  activeWorkspaceId,
  onWorkspaceChange,
  onCreateWorkspace
}) => {
  const [newWorkspaceName, setNewWorkspaceName] = React.useState('');

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim() && onCreateWorkspace) {
      onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '360px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutGrid size={20} color="var(--accent-color)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Dashboard Settings</h2>
              </div>
              <button onClick={onClose}><X size={20} color="rgba(255, 255, 255, 0.5)" /></button>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Grid Columns</label>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-color)' }}>{gridColumns}</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="1"
                value={gridColumns}
                onChange={(e) => onGridColumnsChange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent-color)',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', opacity: 0.4 }}>
                <span>Compact (12)</span>
                <span>Spacious (4)</span>
              </div>
            </div>

            {workspaces && workspaces.length > 0 && (
              <div className="form-group" style={{ marginTop: '24px' }}>
                <label style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px', display: 'block' }}>Workspaces</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {workspaces.map(ws => (
                    <div 
                      key={ws.id}
                      onClick={() => onWorkspaceChange && onWorkspaceChange(ws.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: activeWorkspaceId === ws.id ? 'rgba(124, 77, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: activeWorkspaceId === ws.id ? '1px solid var(--accent-color)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: activeWorkspaceId === ws.id ? 600 : 400 }}>{ws.name}</span>
                      {activeWorkspaceId === ws.id && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-color)' }} />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="New Workspace Name"
                    className="modal-input"
                    value={newWorkspaceName}
                    onChange={e => setNewWorkspaceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
                    style={{ flex: 1, padding: '10px' }}
                  />
                  <button 
                    className="primary-button" 
                    onClick={handleCreateWorkspace}
                    disabled={!newWorkspaceName.trim()}
                    style={{ width: 'auto', padding: '0 16px', marginTop: 0 }}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button 
                className="primary-button" 
                onClick={onClose}
                style={{ marginTop: 0 }}
              >
                Apply Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
