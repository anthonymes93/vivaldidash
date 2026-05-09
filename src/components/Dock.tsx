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
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
}

interface DockProps {
  id?: string;
  align?: 'left' | 'right' | 'center';
  items: Bookmark[];
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onBookmarkClick: (id: string, e?: React.MouseEvent) => void;
  onMouseEnter: (item: Bookmark) => void;
  onMouseLeave: () => void;
  activeId: string | null;
  width?: number | string;
  keyboardSelectedId?: string | null;
  itemSize: number;
}

const Dock: React.FC<DockProps> = ({ 
  id = 'dock',
  align = 'left',
  items, 
  onContextMenu, 
  onBookmarkClick, 
  onMouseEnter,
  onMouseLeave,
  activeId, 
  width,
  keyboardSelectedId,
  itemSize
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
 
  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${Math.max(4, itemSize / 4)}px`,
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
        minHeight: '60px',
        justifyContent: items.length > 0 ? (align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center') : 'center',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        maxWidth: '100%',
        margin: width ? '10px auto 4px auto' : '10px 0 4px 0',
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
            isSelected={keyboardSelectedId === item.id}
            size={itemSize}
            hideTitle={true}
            noBackground={true}
          />
        ))}
      </SortableContext>
    </div>
  );
};

export default Dock;
