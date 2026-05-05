import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

import SearchBar from './components/SearchBar';
import BookmarkCard from './components/BookmarkCard';
import AddBookmarkModal from './components/AddBookmarkModal';
import ContextMenu from './components/ContextMenu';
import ExpandedView from './components/ExpandedView';
import TopBar from './components/TopBar';
import SettingsModal from './components/SettingsModal';
import './App.css';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  notes?: string;
  order?: number;
}

const INITIAL_BOOKMARKS: Bookmark[] = [
  { id: 'skool', title: 'Skool', url: 'https://skool.com', order: 0 },
  { id: 'youtube', title: 'YouTube', url: 'https://youtube.com', order: 1 },
  { id: 'codecademy', title: 'Codecademy', url: 'https://codecademy.com', order: 2 },
  { id: 'quo', title: 'Quo', url: 'https://quo.com', order: 3 },
  { id: 'callrail', title: 'Call Rail', url: 'https://callrail.com', order: 4 },
  { id: 'ads', title: 'Google Ads', url: 'https://ads.google.com', order: 5 },
  { id: 'unbounce', title: 'Unbounce', url: 'https://unbounce.com', order: 6 },
  { id: 'mike', title: 'Mike Andes', url: 'https://mikeandes.com', order: 7 },
  { id: 'hotjar', title: 'Hotjar', url: 'https://hotjar.com', order: 8 },
  { id: 'clarity', title: 'Clarity', url: 'https://clarity.ms', order: 9 },
  { id: 'clickup', title: 'ClickUp', url: 'https://clickup.com', order: 10 },
  { id: 'notion', title: 'Notion', url: 'https://notion.so', order: 11 },
  { id: 'vapi', title: 'Vapi', url: 'https://vapi.ai', order: 12 },
  { id: 'retell', title: 'Retell', url: 'https://retellai.com', order: 13 },
  { id: 'calendly', title: 'Calendly', url: 'https://calendly.com', order: 14 },
  { id: 'miro', title: 'Miro', url: 'https://miro.com', order: 15 },
  { id: 'claude', title: 'Claude Code', url: 'https://claude.ai', order: 16 },
  { id: 'optimizer', title: 'The Optimizer', url: 'https://theoptimizer.io', order: 17 },
  { id: '360nerds', title: '360nerds', url: 'https://360nerds.com', order: 18 },
  { id: 'elevenlabs', title: 'Elevenlabs', url: 'https://elevenlabs.io', order: 19 },
  { id: 'retell-gcal', title: 'Retell G Cal', url: 'https://retellai.com', order: 20 },
  { id: 'gamma', title: 'Gamma Site', url: 'https://gamma.app', order: 21 },
];

// ─── Sortable Bookmark Item ────────────────────────────────────────────────
function SortableBookmarkItem({
  bookmark,
  onContextMenu,
  onClick,
  isDragging,
}: {
  bookmark: Bookmark;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onClick: (id: string) => void;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: bookmark.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkCard
        {...bookmark}
        onClick={() => onClick(bookmark.id)}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────
function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [gridColumns, setGridColumns] = useState<number>(7);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editData, setEditData] = useState<Bookmark | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const unsubBookmarks = onSnapshot(collection(db, 'bookmarks'), (snapshot) => {
      const items: Bookmark[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Bookmark));
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (items.length === 0 && isLoading) {
        seedDatabase();
      } else {
        setBookmarks(items);
        setIsLoading(false);
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'dashboard'), (d) => {
      if (d.exists()) setGridColumns(d.data().gridColumns || 7);
    });

    return () => { unsubBookmarks(); unsubSettings(); };
  }, [isLoading]);

  const seedDatabase = async () => {
    for (const b of INITIAL_BOOKMARKS) {
      const { id, ...data } = b;
      await setDoc(doc(db, 'bookmarks', id), data);
    }
    setIsLoading(false);
  };

  const addBookmark = async (title: string, url: string) => {
    const nextOrder = bookmarks.length > 0
      ? Math.max(...bookmarks.map(b => b.order ?? 0)) + 1 : 0;
    await addDoc(collection(db, 'bookmarks'), { title, url, order: nextOrder });
  };

  const editBookmark = async (id: string, title: string, url: string) => {
    await updateDoc(doc(db, 'bookmarks', id), { title, url });
  };

  const deleteBookmark = async (id: string) => {
    await deleteDoc(doc(db, 'bookmarks', id));
  };

  const updateNotes = async (id: string, notes: string) => {
    await updateDoc(doc(db, 'bookmarks', id), { notes });
  };

  const updateGridColumns = async (cols: number) => {
    setGridColumns(cols);
    await setDoc(doc(db, 'settings', 'dashboard'), { gridColumns: cols }, { merge: true });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = bookmarks.findIndex(b => b.id === active.id);
    const newIndex = bookmarks.findIndex(b => b.id === over.id);
    const reordered = arrayMove(bookmarks, oldIndex, newIndex);

    setBookmarks(reordered); // Optimistic update

    // Persist to Firestore
    reordered.forEach(async (b, index) => {
      if (b.order !== index) {
        await updateDoc(doc(db, 'bookmarks', b.id), { order: index });
      }
    });
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  }, []);

  const handleBookmarkClick = (id: string) => {
    if (activeId) return; // Don't navigate while dragging
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) window.location.href = bookmark.url;
  };

  const handleEditRequest = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) { setEditData(bookmark); setIsModalOpen(true); }
  };

  const expandedBookmark = bookmarks.find(b => b.id === expandedId);
  const activeBookmark = bookmarks.find(b => b.id === activeId);

  return (
    <div className="dashboard-container" onClick={() => setContextMenu(null)}>
      <TopBar
        onAddClick={() => setIsModalOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <motion.img
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
        src="/dashboard_background.png"
        className="background-image"
        alt="background"
      />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: '18px', letterSpacing: '2px', fontWeight: 300 }}
            >
              SYNCING...
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              width: '100%',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '15vh',
              paddingBottom: '100px',
              overflowY: 'auto',
              zIndex: 1,
            }}
          >
            <SearchBar />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={bookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridColumns}, 120px)`,
                    gap: '24px',
                    justifyContent: 'center',
                    width: '100%',
                    padding: '20px',
                    transition: 'grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {bookmarks.map((bookmark) => (
                    <SortableBookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      onContextMenu={handleContextMenu}
                      onClick={handleBookmarkClick}
                      isDragging={activeId === bookmark.id}
                    />
                  ))}

                  {/* Add button sits outside the sortable context */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setEditData(null); setIsModalOpen(true); }}
                    className="glass-card"
                    style={{
                      width: '120px',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <Plus size={32} />
                    <span style={{ fontSize: '13px', marginTop: '8px' }}>Add</span>
                  </motion.button>
                </div>
              </SortableContext>

              {/* Drag overlay — shows a "ghost" card while dragging */}
              <DragOverlay adjustScale={true}>
                {activeBookmark ? (
                  <div style={{ opacity: 0.9, transform: 'scale(1.05)', cursor: 'grabbing' }}>
                    <BookmarkCard
                      {...activeBookmark}
                      onClick={() => {}}
                      onContextMenu={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>

      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onAdd={addBookmark}
        onEdit={editBookmark}
        editData={editData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gridColumns={gridColumns}
        onGridColumnsChange={updateGridColumns}
      />

      <AnimatePresence>
        {expandedBookmark && (
          <ExpandedView
            bookmark={expandedBookmark}
            onClose={() => setExpandedId(null)}
            onSaveNotes={(notes) => updateNotes(expandedBookmark.id, notes)}
          />
        )}
      </AnimatePresence>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={!!contextMenu}
          onClose={() => setContextMenu(null)}
          onRemove={() => deleteBookmark(contextMenu.id)}
          onEdit={() => handleEditRequest(contextMenu.id)}
          onExpand={() => setExpandedId(contextMenu.id)}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          zIndex: 10,
        }}
      >
        VivaldiDash • Premium Workspace
      </motion.div>
    </div>
  );
}

export default App;
