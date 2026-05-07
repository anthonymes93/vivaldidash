import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import BookmarkCard from './BookmarkCard';
import FolderCard from './FolderCard';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  type?: 'bookmark' | 'folder';
  parentId?: string | null;
  order?: number;
  page?: string;
}

interface SortableBookmarkItemProps {
  bookmark: Bookmark;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: (id: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isDragging: boolean;
  folderChildren?: Bookmark[];
  size?: number;
}

export function SortableBookmarkItem({
  bookmark,
  onContextMenu,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isDragging,
  folderChildren = [],
  size = 120,
}: SortableBookmarkItemProps) {
  if (!bookmark) return null;

  const scale = size / 120;
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({
    id: bookmark.id,
  });
  const { active, over } = useDndContext();
  
  const [isCombining, setIsCombining] = useState(false);

  useEffect(() => {
    if (isOver && active && active.id !== bookmark.id) {
      const activeRect = active.rect.current?.translated;
      const overRect = (over as any)?.rect;
      
      if (activeRect && overRect) {
        const activeCenter = { x: activeRect.left + activeRect.width / 2, y: activeRect.top + activeRect.height / 2 };
        const overCenter = { x: overRect.left + overRect.width / 2, y: overRect.top + overRect.height / 2 };
        const distance = Math.sqrt(Math.pow(activeCenter.x - overCenter.x, 2) + Math.pow(activeCenter.y - overCenter.y, 2));
        setIsCombining(distance < 45 * scale);
      }
    } else {
      setIsCombining(false);
    }
  }, [isOver, active, over, bookmark.id, scale]);

  const style: React.CSSProperties = {
    transform: isCombining ? 'none' : CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isCombining ? 100 : (isOver ? 10 : 1),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          width: `${size}px`,
          height: `${size}px`,
          border: '2px dashed rgba(255,255,255,0.2)',
          borderRadius: `${20 * scale}px`,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(4px)',
        }}
        {...attributes}
        {...listeners}
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        scale: isCombining ? 0.94 : 1,
      }} 
      {...attributes} 
      {...listeners}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isCombining && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            inset: -2,
            border: `${2 * scale}px solid rgba(124, 77, 255, 0.6)`,
            borderRadius: `${28 * scale}px`,
            background: 'rgba(124, 77, 255, 0.1)',
            boxShadow: `0 0 ${30 * scale}px rgba(124, 77, 255, 0.3)`,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      )}

      {bookmark.type === 'folder' ? (
        <FolderCard
          id={bookmark.id}
          title={bookmark.title}
          children={folderChildren}
          onContextMenu={onContextMenu}
          onClick={() => onClick(bookmark.id)}
          size={size}
        />
      ) : (
        <BookmarkCard
          {...bookmark}
          onClick={() => onClick(bookmark.id)}
          onContextMenu={onContextMenu}
          size={size}
        />
      )}
    </div>
  );
};
