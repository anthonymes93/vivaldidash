import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
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
  page?: string;
}

const PAGE_IDS = ['dashboard', 'calendar'];

const INITIAL_BOOKMARKS: Bookmark[] = [
  { id: 'skool', title: 'Skool', url: 'https://skool.com', order: 0, page: 'dashboard' },
  { id: 'youtube', title: 'YouTube', url: 'https://youtube.com', order: 1, page: 'dashboard' },
  { id: 'codecademy', title: 'Codecademy', url: 'https://codecademy.com', order: 2, page: 'dashboard' },
  { id: 'quo', title: 'Quo', url: 'https://quo.com', order: 3, page: 'dashboard' },
  { id: 'callrail', title: 'Call Rail', url: 'https://callrail.com', order: 4, page: 'dashboard' },
  { id: 'ads', title: 'Google Ads', url: 'https://ads.google.com', order: 5, page: 'dashboard' },
  { id: 'unbounce', title: 'Unbounce', url: 'https://unbounce.com', order: 6, page: 'dashboard' },
  { id: 'mike', title: 'Mike Andes', url: 'https://mikeandes.com', order: 7, page: 'dashboard' },
  { id: 'hotjar', title: 'Hotjar', url: 'https://hotjar.com', order: 8, page: 'dashboard' },
  { id: 'clarity', title: 'Clarity', url: 'https://clarity.ms', order: 9, page: 'dashboard' },
  { id: 'clickup', title: 'ClickUp', url: 'https://clickup.com', order: 10, page: 'dashboard' },
  { id: 'notion', title: 'Notion', url: 'https://notion.so', order: 11, page: 'dashboard' },
  { id: 'vapi', title: 'Vapi', url: 'https://vapi.ai', order: 12, page: 'dashboard' },
  { id: 'retell', title: 'Retell', url: 'https://retellai.com', order: 13, page: 'dashboard' },
  { id: 'calendly', title: 'Calendly', url: 'https://calendly.com', order: 14, page: 'dashboard' },
  { id: 'miro', title: 'Miro', url: 'https://miro.com', order: 15, page: 'dashboard' },
  { id: 'claude', title: 'Claude Code', url: 'https://claude.ai', order: 16, page: 'dashboard' },
  { id: 'optimizer', title: 'The Optimizer', url: 'https://theoptimizer.io', order: 17, page: 'dashboard' },
  { id: '360nerds', title: '360nerds', url: 'https://360nerds.com', order: 18, page: 'dashboard' },
  { id: 'elevenlabs', title: 'Elevenlabs', url: 'https://elevenlabs.io', order: 19, page: 'dashboard' },
  { id: 'retell-gcal', title: 'Retell G Cal', url: 'https://retellai.com', order: 20, page: 'dashboard' },
  { id: 'gamma', title: 'Gamma Site', url: 'https://gamma.app', order: 21, page: 'dashboard' },
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
    transition: transition || 'transform 180ms ease',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          width: '120px',
          height: '120px',
          border: '2px dashed rgba(255,255,255,0.2)',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(4px)',
        }}
        {...attributes}
        {...listeners}
      />
    );
  }

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
  const [activePage, setActivePage] = useState('dashboard');
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
    const pageBookmarks = bookmarks.filter(b => (b.page || 'dashboard') === activePage);
    const nextOrder = pageBookmarks.length > 0
      ? Math.max(...pageBookmarks.map(b => b.order ?? 0)) + 1 : 0;
    await addDoc(collection(db, 'bookmarks'), { title, url, order: nextOrder, page: activePage });
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

    if (!over) return;

    const draggedBookmarkId = active.id as string;
    const overId = over.id as string;

    // Dropped onto a PAGE tab → move bookmark to that page
    if (PAGE_IDS.includes(overId)) {
      const targetPage = overId;
      const bookmark = bookmarks.find(b => b.id === draggedBookmarkId);
      if (bookmark && (bookmark.page || 'dashboard') !== targetPage) {
        // Optimistic update
        setBookmarks(prev =>
          prev.map(b => b.id === draggedBookmarkId ? { ...b, page: targetPage } : b)
        );
        await updateDoc(doc(db, 'bookmarks', draggedBookmarkId), { page: targetPage });
        // Switch to the target page so user sees where it went
        setActivePage(targetPage);
      }
      return;
    }

    // Dropped onto another bookmark → reorder within the page
    if (draggedBookmarkId === overId) return;

    const pageBookmarks = bookmarks.filter(b => (b.page || 'dashboard') === activePage);
    const oldIndex = pageBookmarks.findIndex(b => b.id === draggedBookmarkId);
    const newIndex = pageBookmarks.findIndex(b => b.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(pageBookmarks, oldIndex, newIndex);

    // Merge back with other pages' bookmarks
    const otherBookmarks = bookmarks.filter(b => (b.page || 'dashboard') !== activePage);
    setBookmarks([...otherBookmarks, ...reordered]);

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
    if (activeId) return;
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) window.location.href = bookmark.url;
  };

  const handleEditRequest = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) { setEditData(bookmark); setIsModalOpen(true); }
  };

  // Filter bookmarks for current page
  const pageBookmarks = bookmarks.filter(b => (b.page || 'dashboard') === activePage);
  const expandedBookmark = bookmarks.find(b => b.id === expandedId);
  const activeBookmark = bookmarks.find(b => b.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="dashboard-container" onClick={() => setContextMenu(null)}>
        <TopBar
          onAddClick={() => setIsModalOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          activePage={activePage}
          onPageChange={setActivePage}
          isDragging={!!activeId}
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
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
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

              {pageBookmarks.length === 0 && !isLoading ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '40px',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <div style={{ fontSize: '48px' }}>📂</div>
                  <p style={{ fontSize: '16px', fontWeight: 300 }}>
                    Drag bookmarks here from Dashboard
                  </p>
                </motion.div>
              ) : (
                <SortableContext items={pageBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
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
                    {pageBookmarks.map((bookmark) => (
                      <SortableBookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onContextMenu={handleContextMenu}
                        onClick={handleBookmarkClick}
                        isDragging={activeId === bookmark.id}
                      />
                    ))}

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
              )}
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

      {/* Premium drag overlay — rendered at DndContext level so it floats over TopBar too */}
      <DragOverlay
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeBookmark ? (
          <div
            style={{
              cursor: 'grabbing',
              transform: 'scale(1.08) rotate(2deg)',
              filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.7)) drop-shadow(0 0 24px rgba(124,77,255,0.5))',
              transition: 'none',
            }}
          >
            <BookmarkCard
              {...activeBookmark}
              onClick={() => {}}
              onContextMenu={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
