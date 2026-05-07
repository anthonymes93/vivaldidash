import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableBookmarkItem } from './SortableBookmarkItem';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  type?: 'bookmark' | 'folder';
  parentId?: string | null;
  order?: number;
  page?: string;
}

interface FolderExpandedViewProps {
  id: string;
  title: string;
  items: Bookmark[];
  onClose: () => void;
  onBookmarkClick: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  activeId: string | null;
}

const FolderExpandedView: React.FC<FolderExpandedViewProps> = ({
  title,
  items,
  onClose,
  onBookmarkClick,
  onContextMenu,
  activeId,
}) => {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'remove-from-folder',
  });

  return (
    <motion.div
      ref={setDropRef}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        background: isOver ? 'rgba(124, 77, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)',
      }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(30px)',
        transition: 'background 0.3s ease',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          y: 0,
          borderColor: isOver ? 'rgba(124, 77, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
        }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        style={{
          width: '90%',
          maxWidth: '800px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px',
          boxShadow: isOver ? '0 0 50px rgba(124, 77, 255, 0.2)' : '0 40px 100px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 600, margin: 0, color: 'white' }}>{title}</h2>
          <motion.button
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <X size={24} />
          </motion.button>
        </div>

        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 120px)',
            gap: '24px',
            justifyContent: 'center',
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: '10px',
          }}>
            {items.map((item) => (
              <SortableBookmarkItem
                key={item.id}
                bookmark={item}
                onContextMenu={onContextMenu}
                onClick={onBookmarkClick}
                isDragging={activeId === item.id}
              />
            ))}
          </div>
        </SortableContext>
      </motion.div>
    </motion.div>
  );
};

export default FolderExpandedView;
