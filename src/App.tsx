import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [gridColumns, setGridColumns] = useState<number>(7);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editData, setEditData] = useState<Bookmark | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubBookmarks = onSnapshot(collection(db, 'bookmarks'), (snapshot) => {
      const items: Bookmark[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Bookmark);
      });
      
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (items.length === 0 && isLoading) {
        seedDatabase();
      } else {
        setBookmarks(items);
        setIsLoading(false);
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'dashboard'), (doc) => {
      if (doc.exists()) {
        setGridColumns(doc.data().gridColumns || 7);
      }
    });

    return () => {
      unsubBookmarks();
      unsubSettings();
    };
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
      ? Math.max(...bookmarks.map(b => b.order ?? 0)) + 1 
      : 0;
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

  const moveBookmark = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    const newBookmarks = [...bookmarks];
    const dragItem = newBookmarks[dragIndex];
    newBookmarks.splice(dragIndex, 1);
    newBookmarks.splice(hoverIndex, 0, dragItem);
    setBookmarks(newBookmarks);
  };

  const syncOrderToFirebase = async (finalBookmarks: Bookmark[]) => {
    // Only update if order actually changed to save writes
    const batch = finalBookmarks.map((b, index) => {
      if (b.order !== index) {
        return updateDoc(doc(db, 'bookmarks', b.id), { order: index });
      }
      return null;
    }).filter(Boolean);
    
    await Promise.all(batch);
  };

  const handleDrag = (index: number, info: any) => {
    if (!gridRef.current) return;
    
    const { x, y } = info.point;
    const gridRect = gridRef.current.getBoundingClientRect();
    
    // Calculate local coordinates within the grid
    const localX = x - gridRect.left;
    const localY = y - gridRect.top;
    
    // Each item is 120px + 24px gap = 144px
    const col = Math.floor(localX / 144);
    const row = Math.floor(localY / 144);
    
    // Constrain to valid grid bounds
    const safeCol = Math.max(0, Math.min(col, gridColumns - 1));
    const safeRow = Math.max(0, row);
    
    const targetIndex = safeRow * gridColumns + safeCol;
    
    if (targetIndex >= 0 && targetIndex < bookmarks.length && targetIndex !== index) {
      moveBookmark(index, targetIndex);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  }, []);

  const handleBookmarkClick = (id: string) => {
    if (draggedId) return;
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      window.location.href = bookmark.url;
    }
  };

  const handleEditRequest = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      setEditData(bookmark);
      setIsModalOpen(true);
    }
  };

  const expandedBookmark = bookmarks.find(b => b.id === expandedId);

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

            <div 
              ref={gridRef}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 120px)`,
                gap: '24px',
                justifyContent: 'center',
                width: '100%',
                padding: '20px',
                transition: 'grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              {bookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark.id}
                  layout
                  drag
                  dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
                  dragElastic={0.1}
                  onDragStart={() => setDraggedId(bookmark.id)}
                  onDrag={(e, info) => handleDrag(index, info)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    syncOrderToFirebase(bookmarks);
                  }}
                  style={{
                    zIndex: draggedId === bookmark.id ? 100 : 1,
                    cursor: draggedId === bookmark.id ? 'grabbing' : 'grab',
                  }}
                >
                  <BookmarkCard
                    {...bookmark}
                    onClick={() => handleBookmarkClick(bookmark.id)}
                    onContextMenu={handleContextMenu}
                  />
                </motion.div>
              ))}

              <motion.button
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditData(null);
                  setIsModalOpen(true);
                }}
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
          </motion.div>
        )}
      </AnimatePresence>

      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
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
