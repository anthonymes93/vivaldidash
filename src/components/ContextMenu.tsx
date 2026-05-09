import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit3, Maximize2, CheckSquare, FolderInput, Layers, FolderPlus, StickyNote, ArrowUp } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  isFolder: boolean;
  hasSelection: boolean;
  onClose: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onExpand: () => void;
  onSelectIcon: () => void;
  onAddSelectedToGroup: () => void;
  onBreakApartGroup: () => void;
  onCreateGroupWithSelected: () => void;
  onOpenNotes: () => void;
  onMoveUp?: () => void;
  hasParent?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isOpen,
  isFolder,
  hasSelection,
  onClose,
  onRemove,
  onEdit,
  onExpand,
  onSelectIcon,
  onAddSelectedToGroup,
  onBreakApartGroup,
  onCreateGroupWithSelected,
  onOpenNotes,
  onMoveUp,
  hasParent,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            position: 'fixed',
            top: y,
            left: x,
            zIndex: 2000,
            minWidth: '200px',
            padding: '8px',
          }}
          className="glass"
        >
          <div className="context-menu-item" onClick={() => { onExpand(); onClose(); }}>
            <Maximize2 size={16} />
            <span>Expand Widget</span>
          </div>
          <div className="context-menu-item" onClick={() => { onOpenNotes(); onClose(); }}>
            <StickyNote size={16} />
            <span>Quick Notes</span>
          </div>

          {hasParent && onMoveUp && (
            <div className="context-menu-item" onClick={() => { onMoveUp(); onClose(); }}>
              <ArrowUp size={16} />
              <span>Send Icon Back</span>
            </div>
          )}
          <div className="context-menu-item" onClick={() => { onEdit(); onClose(); }}>
            <Edit3 size={16} />
            <span>Edit {isFolder ? 'Group' : 'Bookmark'}</span>
          </div>
          
          {!isFolder && (
            <div className="context-menu-item" onClick={() => { onSelectIcon(); onClose(); }}>
              <CheckSquare size={16} />
              <span>Select Icon</span>
            </div>
          )}

          {isFolder && hasSelection && (
            <div className="context-menu-item" onClick={() => { onAddSelectedToGroup(); onClose(); }}>
              <FolderInput size={16} />
              <span>Add Selected to Group</span>
            </div>
          )}

          {!isFolder && hasSelection && (
            <div className="context-menu-item" onClick={() => { onCreateGroupWithSelected(); onClose(); }}>
              <FolderPlus size={16} />
              <span>Create Group with Selected</span>
            </div>
          )}

          {isFolder && (
            <div className="context-menu-item" onClick={() => { onBreakApartGroup(); onClose(); }}>
              <Layers size={16} />
              <span>Break Apart Group</span>
            </div>
          )}

          <div className="context-menu-item danger" onClick={() => { onRemove(); onClose(); }}>
            <Trash2 size={16} />
            <span>Remove</span>
          </div>

          <style>{`
            .context-menu-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
              transition: all 0.2s;
            }
            .context-menu-item:hover {
              background: rgba(255, 255, 255, 0.1);
              color: white;
            }
            .context-menu-item.danger:hover {
              background: rgba(255, 59, 48, 0.2);
              color: #ff3b30;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextMenu;
