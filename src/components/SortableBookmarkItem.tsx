import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BookmarkCard from './BookmarkCard';
import FolderCard from './FolderCard';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  type?: 'bookmark' | 'folder' | 'note';
  notes?: string;
  quickNote?: string;
  useQuickNoteOnHover?: boolean;
  pinToEnd?: boolean;
  parentId?: string | null;
  order?: number;
  page?: string;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
  priorityText?: string;
  isDashboardWidget?: boolean;
  useCoverIcon?: boolean;
  isFullCover?: boolean;
}

interface SortableBookmarkItemProps {
  bookmark: Bookmark;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: (id: string, e?: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isDragging: boolean;
  folderChildren?: Bookmark[];
  size?: number;
  hideTitle?: boolean;
  noBackground?: boolean;
  isSelected?: boolean;
  useQuickNoteOnHover?: boolean;
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
  hideTitle = false,
  noBackground = false,
  isSelected = false,
  useQuickNoteOnHover = false,
}: SortableBookmarkItemProps) {
  if (!bookmark) return null;

  const scale = size / 120;
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({
    id: bookmark.id,
  });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isOver ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div
      ref={setNodeRef}
      id={bookmark.id}
      style={{
        ...style,
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        transform: `${style.transform || ''} scale(${isSelected ? 1.05 : 1})`,
        pointerEvents: isDragging ? 'none' : 'auto',
      }}
      {...attributes}
      {...listeners}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: -3 * scale,
            border: `${1.5 * scale}px solid rgba(255, 255, 255, 0.4)`,
            borderRadius: `${26 * scale}px`,
            boxShadow: `0 0 ${15 * scale}px rgba(255, 255, 255, 0.2)`,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      {bookmark.type === 'folder' && !bookmark.useCoverIcon ? (
        <FolderCard
          id={bookmark.id}
          title={bookmark.title}
          children={folderChildren}
          onContextMenu={onContextMenu}
          onClick={(e) => onClick(bookmark.id, e)}
          size={size}
          hideTitle={hideTitle}
        />
      ) : (
        <BookmarkCard
          {...bookmark}
          isFullCover={bookmark.isFullCover}
          onClick={(e) => onClick(bookmark.id, e)}
          onContextMenu={onContextMenu}
          size={size}
          hideTitle={hideTitle}
          noBackground={noBackground}
          isDashboardWidget={bookmark.isDashboardWidget}
          useQuickNoteOnHover={useQuickNoteOnHover || bookmark.useQuickNoteOnHover}
        />
      )}
    </div>
  );
};
