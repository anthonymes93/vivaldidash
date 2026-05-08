import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBookmarkItem } from './SortableBookmarkItem';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  type?: 'bookmark' | 'folder';
  parentId?: string;
  page?: string;
}

interface DockProps {
  items: Bookmark[];
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onBookmarkClick: (url: string) => void;
  onMouseEnter: (item: Bookmark) => void;
  onMouseLeave: () => void;
  activeId: string | null;
  width?: number;
}

const Dock: React.FC<DockProps> = ({ 
  items, 
  onContextMenu, 
  onBookmarkClick, 
  onMouseEnter,
  onMouseLeave,
  activeId, 
  width = 600 
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'dock' });
 
  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: items.length > 0 ? '4px 0' : (isOver ? '20px 0' : '0'),
        background: isOver ? 'rgba(124, 77, 255, 0.05)' : 'transparent',
        backdropFilter: isOver ? 'blur(10px)' : 'none',
        borderRadius: '12px',
        border: 'none',
        borderBottom: (items.length > 0 || isOver) 
          ? `2px solid ${isOver ? '#7c4dff' : 'rgba(255, 255, 255, 0.05)'}` 
          : 'none',
        boxShadow: isOver ? '0 10px 30px -10px rgba(124, 77, 255, 0.3)' : 'none',
        marginTop: '10px',
        marginBottom: '4px',
        minHeight: (items.length > 0 || isOver) ? '40px' : '0',
        justifyContent: 'flex-start',
        width: `${width}px`,
        maxWidth: '95%',
        margin: '10px auto 4px auto',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
        {items.map((item) => (
          <SortableBookmarkItem
            key={item.id}
            bookmark={item}
            onContextMenu={onContextMenu}
            onClick={onBookmarkClick}
            onMouseEnter={() => onMouseEnter(item)}
            onMouseLeave={onMouseLeave}
            isDragging={activeId === item.id}
            size={32}
            hideTitle={true}
            noBackground={true}
          />
        ))}
      </SortableContext>
    </div>
  );
};

export default Dock;
