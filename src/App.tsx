import { useState, useEffect, useCallback } from 'react';
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
  getDocs,
  query,
  limit
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
}

const INITIAL_BOOKMARKS: Bookmark[] = [
  { id: 'skool', title: 'Skool', url: 'https://skool.com' },
  { id: 'youtube', title: 'YouTube', url: 'https://youtube.com' },
  { id: 'codecademy', title: 'Codecademy', url: 'https://codecademy.com' },
  { id: 'quo', title: 'Quo', url: 'https://quo.com' },
  { id: 'callrail', title: 'Call Rail', url: 'https://callrail.com' },
  { id: 'ads', title: 'Google Ads', url: 'https://ads.google.com' },
  { id: 'unbounce', title: 'Unbounce', url: 'https://unbounce.com' },
  { id: 'mike', title: 'Mike Andes', url: 'https://mikeandes.com' },
  { id: 'hotjar', title: 'Hotjar', url: 'https://hotjar.com' },
  { id: 'clarity', title: 'Clarity', url: 'https://clarity.ms' },
  { id: 'clickup', title: 'ClickUp', url: 'https://clickup.com' },
  { id: 'notion', title: 'Notion', url: 'https://notion.so' },
  { id: 'vapi', title: 'Vapi', url: 'https://vapi.ai' },
  { id: 'retell', title: 'Retell', url: 'https://retellai.com' },
  { id: 'calendly', title: 'Calendly', url: 'https://calendly.com' },
  { id: 'miro', title: 'Miro', url: 'https://miro.com' },
  { id: 'claude', title: 'Claude Code', url: 'https://claude.ai' },
  { id: 'optimizer', title: 'The Optimizer', url: 'https://theoptimizer.io' },
  { id: '360nerds', title: '360nerds', url: 'https://360nerds.com' },
  { id: 'elevenlabs', title: 'Elevenlabs', url: 'https://elevenlabs.io' },
  { id: 'retell-gcal', title: 'Retell G Cal', url: 'https://retellai.com' },
  { id: 'gamma', title: 'Gamma Site', url: 'https://gamma.app' },
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

  // 1. Listen for real-time updates from Firestore
  useEffect(() => {
    const unsubBookmarks = onSnapshot(collection(db, 'bookmarks'), (snapshot) => {
      const items: Bookmark[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Bookmark);
      });
      
      if (items.length === 0 && isLoading) {
        // Migration: If Firestore is empty, seed it with INITIAL_BOOKMARKS
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
    console.log('Seeding database with initial bookmarks...');
    for (const b of INITIAL_BOOKMARKS) {
      const { id, ...data } = b;
      await setDoc(doc(db, 'bookmarks', id), data);
    }
    setIsLoading(false);
  };

  // CRUD Operations
  const addBookmark = async (title: string, url: string) => {
    await addDoc(collection(db, 'bookmarks'), { title, url });
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
    setGridColumns(cols); // Optimistic update
    await setDoc(doc(db, 'settings', 'dashboard'), { gridColumns: cols }, { merge: true });
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  }, []);

  const handleBookmarkClick = (id: string) => {
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

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontSize: '18px', letterSpacing: '2px', fontWeight: 300 }}
        >
          SYNCING...
        </motion.div>
      </div>
    );
  }

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

      <div style={{
        marginTop: '60px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: '100px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 64px)',
      }}>
        <SearchBar />

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 120px)`,
          gap: '24px',
          justifyContent: 'center',
          width: '1200px',
          maxWidth: '95%',
          padding: '20px',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <AnimatePresence>
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                {...bookmark}
                onClick={() => handleBookmarkClick(bookmark.id)}
                onContextMenu={handleContextMenu}
              />
            ))}
          </AnimatePresence>

          <motion.button
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
      </div>

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
