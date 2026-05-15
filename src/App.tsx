import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Play, Pause, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';

import { SortableBookmarkItem } from './components/SortableBookmarkItem';
import SearchBar from './components/SearchBar';
import BookmarkCard from './components/BookmarkCard';
import AddBookmarkModal from './components/AddBookmarkModal';
import ContextMenu from './components/ContextMenu';
import ExpandedView from './components/ExpandedView';
import TopBar from './components/TopBar';
import SettingsModal from './components/SettingsModal';
import WhiteboardView from './components/WhiteboardView';
import CalendarView from './components/CalendarView';
import CalendarWidget from './components/CalendarWidget';
import GoalView from './components/GoalView';
import FolderCard from './components/FolderCard';
import HabitsView from './components/HabitsView';

import BackgroundSelectorModal from './components/BackgroundSelectorModal';
import Dock from './components/Dock';
import GroupNotes from './components/GroupNotes';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  notes?: string;
  quickNote?: string;
  useQuickNoteOnHover?: boolean;
  pinToEnd?: boolean;
  order?: number;
  page?: string;
  type?: 'bookmark' | 'folder' | 'note';
  parentId?: string;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
  isDashboardWidget?: boolean;
  useCoverIcon?: boolean;
  isFullCover?: boolean;
  workspaceId?: string;
  priorityText?: string;
  description?: string;
}

interface Workspace {
  id: string;
  name: string;
}

const PAGE_IDS: string[] = []; // Disabled for stability during reorder debugging

const INITIAL_BOOKMARKS: Bookmark[] = [
  { id: 'skool', title: 'Skool', url: 'https://skool.com', order: 0, page: 'dashboard' },
  { id: 'youtube', title: 'YouTube', url: 'https://youtube.com', order: 1, page: 'dashboard' },
  { id: 'codecademy', title: 'Codecademy', url: 'https://codecademy.com', order: 2, page: 'dashboard' },
  { id: 'quo', title: 'Quo', url: 'https://quo.com', order: 3, page: 'dashboard' },
  { id: 'callrail', title: 'Call Rail', url: 'https://callrail.com', order: 4, page: 'dashboard' },
  { id: 'ads', title: 'Google Ads', url: 'https://ads.google.com', order: 5, page: 'dashboard' },
  { id: 'unbounce', title: 'unbounce', url: 'https://unbounce.com', order: 6, page: 'dashboard' },
  { id: 'mikeandes', title: 'Mike Andes', url: 'https://mikeandes.com', order: 7, page: 'dashboard' },
  { id: 'hotjar', title: 'Hotjar', url: 'https://hotjar.com', order: 8, page: 'dashboard' },
  { id: 'clarity', title: 'Clarity', url: 'https://clarity.ms', order: 9, page: 'dashboard' },
  { id: 'clickup', title: 'ClickUp', url: 'https://clickup.com', order: 10, page: 'dashboard' },
  { id: 'notion', title: 'Notion', url: 'https://notion.so', order: 11, page: 'dashboard' },
  { id: 'vapi', title: 'Vapi', url: 'https://vapi.ai', order: 12, page: 'dashboard' },
  { id: 'retell', title: 'Retell', url: 'https://retellai.com', order: 13, page: 'dashboard' },
  { id: 'calendly', title: 'Calendly', url: 'https://calendly.com', order: 14, page: 'dashboard' },
  { id: 'miro', title: 'Miro', url: 'https://miro.com', order: 15, page: 'dashboard' },
  { id: 'claudecode', title: 'Claude Code', url: 'https://claude.ai', order: 16, page: 'dashboard' },
  { id: 'optimizer', title: 'The Optimizer', url: 'https://theoptimizer.io', order: 17, page: 'dashboard' },
  { id: '360nerds', title: '360nerds', url: 'https://360nerds.com', order: 18, page: 'dashboard' },
  { id: 'elevenlabs', title: 'Elevenlabs', url: 'https://elevenlabs.io', order: 19, page: 'dashboard' },
  { id: 'retellgcal', title: 'Retell G Cal B...', url: 'https://youtube.com', order: 20, page: 'dashboard' },
  { id: 'gamma', title: 'Gamma Site', url: 'https://gamma.app', order: 21, page: 'dashboard' },
  { id: 'motionarray', title: 'motionarray...', url: 'https://motionarray.com', order: 22, page: 'dashboard' },
  { id: 'reeltemplates', title: 'Reel templates', url: 'https://chatgpt.com', order: 23, page: 'dashboard' },
  { id: 'verticalstories', title: 'Vertical Stories', url: 'https://stories.com', order: 24, page: 'dashboard' },
  { id: 'instagramreels', title: 'instagram+re...', url: 'https://instagram.com/reels', order: 25, page: 'dashboard' },
];

function App() {
  const { setNodeRef: setDashboardRef } = useDroppable({ id: 'dashboard-background' });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [gridColumns, setGridColumns] = useState<number>(7);
  const [activePage, setActivePage] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [previewBgIndex, setPreviewBgIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Bookmark | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [keyboardSelectedId, setKeyboardSelectedId] = useState<string | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('default');

  const updateDashboard = async (updates: any) => {
    try {
      await updateDoc(doc(db, 'settings', 'dashboard'), updates);
    } catch (e) {
      console.error("Error updating dashboard state:", e);
    }
  };

  const [selectedBookmarkIdsState, setSelectedBookmarkIdsState] = useState<string[]>([]);
  const selectedBookmarkIdsRef = useRef<string[]>([]);

  const setSelectedBookmarkIds = useCallback((updater: React.SetStateAction<string[]>) => {
    setSelectedBookmarkIdsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      selectedBookmarkIdsRef.current = next;
      return next;
    });
  }, []);
  const [nestingGroupId, setNestingGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredBookmark, setHoveredBookmark] = useState<{
    id: string;
    title: string;
    url: string;
    iconType?: 'favicon' | 'lucide' | 'custom';
    lucideIcon?: string;
    iconColor?: string;
    customIconUrl?: string;
    priorityText?: string;
  } | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768;

  const [goals, setGoals] = useState<any[]>([]);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [showGoalMarquee, setShowGoalMarquee] = useState(false);
  const [goalMarqueeInterval, setGoalMarqueeInterval] = useState(30); // Default 30s
  const [goalMarqueeRepeatCount, setGoalMarqueeRepeatCount] = useState(1); // Default 1
  const [widgetPauseMins, setWidgetPauseMins] = useState(10); // Default 10 min
  const [isWidgetPaused, setIsWidgetPaused] = useState(false);
  const [widgetPauseSecondsLeft, setWidgetPauseSecondsLeft] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editingDescValue, setEditingDescValue] = useState('');
  const [goalCycleCount, setGoalCycleCount] = useState(0);
  const [activeWidgetTab, setActiveWidgetTab] = useState<'calendar' | 'notes'>('calendar');
  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(true);

  // Widget Pause Timer (lives in App to survive widget unmounting when in folders)
  useEffect(() => {
    if (!isWidgetPaused || widgetPauseSecondsLeft <= 0) return;

    const tick = setInterval(() => {
      setWidgetPauseSecondsLeft(prev => {
        if (prev <= 1) {
          setIsWidgetPaused(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [isWidgetPaused, widgetPauseSecondsLeft]);

  const toggleWidgetPause = useCallback(() => {
    if (isWidgetPaused) {
      updateDashboard({ isWidgetPaused: false, widgetPauseUntil: 0 });
    } else {
      const until = Date.now() + (widgetPauseMins * 60 * 1000);
      updateDashboard({ isWidgetPaused: true, widgetPauseUntil: until });
    }
  }, [isWidgetPaused, widgetPauseMins]);

  const [backgrounds, setBackgrounds] = useState<string[]>([
    '/bg1.png',
    '/bg2.png',
    'youtube:VpG0GUSz8-s',
    '/bg3.png',
    '/bg4.png',
    '/bg5.png'
  ]);
  const [bgRotationInterval, setBgRotationInterval] = useState<number>(15000);
  const [bgIndex, setBgIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); // 0 to 100
  const [videoTime, setVideoTime] = useState({ current: 0, total: 0 });
  const [player, setPlayer] = useState<any>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Load YouTube API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Define global callback for YT API
    (window as any).onYouTubeIframeAPIReady = () => {
      // API is ready
      if (backgrounds[bgIndex]?.startsWith('youtube:')) {
        initializePlayer();
      }
    };
  }, []);

  const initializePlayer = () => {
    const YT = (window as any).YT;
    if (YT && YT.Player && document.getElementById('bg-video-iframe')) {
      const p = new YT.Player('bg-video-iframe', {
        events: {
          onReady: () => {
            setPlayer(p);
          }
        }
      });
    }
  };

  // Re-initialize player when background changes or API becomes available
  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) {
      initializePlayer();
    }
  }, [bgIndex]);

  // Sync progress bar
  useEffect(() => {
    let interval: any;
    if (player && player.getCurrentTime) {
      interval = setInterval(() => {
        if (isSeeking) return; // Don't overwrite user input
        try {
          const current = player.getCurrentTime();
          const total = player.getDuration();
          if (total > 0) {
            setVideoProgress((current / total) * 100);
            setVideoTime({ current, total });
          }
        } catch (e) { }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [player, isSeeking]);

  const handleBgClick = () => {
    // Only toggle if we're not in a modal or settings
    if (!isModalOpen && !isSettingsOpen && !expandedId && !expandedFolderId) {
      updateDashboard({ isZenMode: !isZenMode });
      setContextMenu(null);
    }
  };

  // Handle Fullscreen side effects
  useEffect(() => {
    try {
      if (isZenMode) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => { });
        }
      }
    } catch (e) {
      console.warn("Fullscreen toggle failed:", e);
    }
  }, [isZenMode]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    const handleGlobalScroll = (e: WheelEvent) => {
      if (hoveredBookmark) {
        const notesArea = document.querySelector('.notes-textarea') as HTMLTextAreaElement;
        if (notesArea) {
          notesArea.scrollTop += e.deltaY;
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', handleGlobalScroll, { passive: false });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleGlobalScroll);
    };
  }, [hoveredBookmark]);

  const nextBg = () => {
    const nextIdx = (bgIndex + 1) % backgrounds.length;
    updateDashboard({ bgIndex: nextIdx });
  };
  const prevBg = () => {
    const prevIdx = (bgIndex - 1 + backgrounds.length) % backgrounds.length;
    updateDashboard({ bgIndex: prevIdx });
  };

  const deleteBackground = async (index: number) => {
    if (backgrounds.length <= 1) return; // Prevent deleting the last background
    const newBgs = backgrounds.filter((_, i) => i !== index);
    setBackgrounds(newBgs);
    if (bgIndex >= newBgs.length || bgIndex === index) {
      setBgIndex(Math.max(0, newBgs.length - 1));
    }
    await setDoc(doc(db, 'settings', 'dashboard'), { backgrounds: newBgs }, { merge: true });
  };

  const addBackground = async (bg: string) => {
    const newBgs = [...backgrounds, bg];
    setBackgrounds(newBgs);
    setBgIndex(newBgs.length - 1);
    await setDoc(doc(db, 'settings', 'dashboard'), { backgrounds: newBgs }, { merge: true });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % backgrounds.length);
    }, bgRotationInterval);
    return () => clearInterval(interval);
  }, [isPaused, backgrounds.length, bgRotationInterval]);

  // Goal Marquee Cycling
  useEffect(() => {
    if (!showGoalMarquee || goals.length === 0) return;
    const interval = setInterval(() => {
      setCurrentGoalIndex(prev => (prev + 1) % goals.length);
      setGoalCycleCount(prev => prev + 1);
    }, goalMarqueeInterval * 1000);
    return () => clearInterval(interval);
  }, [showGoalMarquee, goals.length, goalMarqueeInterval]);

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

    const unsubWorkspaces = onSnapshot(collection(db, 'workspaces'), (snapshot) => {
      const items: Workspace[] = [];
      snapshot.forEach(d => items.push({ id: d.id, ...d.data() } as Workspace));

      if (items.length === 0) {
        // Create default workspace if it doesn't exist
        const defaultWorkspace = { name: 'Main Dashboard' };
        setDoc(doc(db, 'workspaces', 'default'), defaultWorkspace).catch(console.error);
        items.push({ id: 'default', ...defaultWorkspace });
      }
      setWorkspaces(items);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'dashboard'), (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.backgrounds) setBackgrounds(data.backgrounds);
        if (data.bgRotationInterval) setBgRotationInterval(data.bgRotationInterval);
        if (data.gridColumns) setGridColumns(data.gridColumns);
        if (data.showGoalMarquee !== undefined) setShowGoalMarquee(data.showGoalMarquee);
        if (data.goalMarqueeInterval) setGoalMarqueeInterval(data.goalMarqueeInterval);
        if (data.goalMarqueeRepeatCount !== undefined) setGoalMarqueeRepeatCount(data.goalMarqueeRepeatCount);
        if (data.widgetPauseMins) setWidgetPauseMins(data.widgetPauseMins);
        
        // Sync Live State
        if (data.activePage) setActivePage(data.activePage);
        if (data.activeWorkspaceId) setActiveWorkspaceId(data.activeWorkspaceId);
        if (data.bgIndex !== undefined) setBgIndex(data.bgIndex);
        if (data.isPaused !== undefined) setIsPaused(data.isPaused);
        if (data.isZenMode !== undefined) setIsZenMode(data.isZenMode);
        if (data.expandedFolderId !== undefined) setExpandedFolderId(data.expandedFolderId);
        if (data.activeWidgetTab) setActiveWidgetTab(data.activeWidgetTab);
        if (data.isWidgetCollapsed !== undefined) setIsWidgetCollapsed(data.isWidgetCollapsed);
        if (data.nestingGroupId !== undefined) setNestingGroupId(data.nestingGroupId);

        // Sync Widget Pause Timer
        if (data.widgetPauseUntil) {
          const remaining = Math.max(0, Math.floor((data.widgetPauseUntil - Date.now()) / 1000));
          if (remaining > 0) {
            setIsWidgetPaused(true);
            setWidgetPauseSecondsLeft(remaining);
          } else {
            setIsWidgetPaused(false);
            setWidgetPauseSecondsLeft(0);
          }
        } else if (data.isWidgetPaused !== undefined) {
          setIsWidgetPaused(data.isWidgetPaused);
          if (!data.isWidgetPaused) setWidgetPauseSecondsLeft(0);
        }
      }
    });

    const unsubGoals = onSnapshot(collection(db, 'main_goals'), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setGoals(items);
    });

    return () => { unsubBookmarks(); unsubWorkspaces(); unsubSettings(); unsubGoals(); };
  }, [isLoading]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    setVideoProgress(percent);
    // Update local time for instant feedback while dragging
    if (videoTime.total > 0) {
      setVideoTime(prev => ({ ...prev, current: (percent / 100) * prev.total }));
    }
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    if (player) {
      const duration = player.getDuration();
      player.seekTo((videoProgress / 100) * duration, true);
    }
  };

  const seedDatabase = async () => {
    for (const b of INITIAL_BOOKMARKS) {
      const { id, ...data } = b;
      await setDoc(doc(db, 'bookmarks', id), data);
    }
    setIsLoading(false);
  };

  /*
  const resetBookmarks = async () => {
    if (!window.confirm('Remove all current bookmarks and reset to the ones from the photo?')) return;
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'bookmarks'));
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'bookmarks', d.id));
      }
      await seedDatabase();
    } catch (err) {
      console.error('Reset failed:', err);
    }
    setIsLoading(false);
  };
  */

  const addBookmark = async (title: string, url: string, iconProps?: any) => {
    const parentId = expandedFolderId;
    const pageBookmarks = bookmarks.filter(b =>
      (b.page || 'dashboard') === activePage &&
      (parentId ? b.parentId === parentId : !b.parentId) &&
      (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))
    );
    const nextOrder = pageBookmarks.length;

    const newBookmarkData: any = {
      title,
      url,
      order: nextOrder,
      page: parentId ? 'hidden' : activePage,
      workspaceId: activeWorkspaceId,
      ...iconProps
    };

    if (parentId) {
      newBookmarkData.parentId = parentId;
    }

    Object.keys(newBookmarkData).forEach(key => {
      if (newBookmarkData[key] === undefined) {
        delete newBookmarkData[key];
      }
    });

    const docRef = await addDoc(collection(db, 'bookmarks'), newBookmarkData);
    return docRef.id;
  };
  const editBookmark = async (id: string, title: string, url: string, iconProps?: any) => {
    const updateData: any = { title, url, ...iconProps };

    // Ensure parentId is preserved or updated if needed
    const existing = bookmarks.find(b => b.id === id);
    if (existing?.parentId) {
      updateData.parentId = existing.parentId;
      updateData.page = 'hidden';
    }

    // Actually, Firebase updateDoc ignores undefined fields, so we need to use deleteField() if we want to remove them.
    // For simplicity, we just won't update them if they are undefined.
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(doc(db, 'bookmarks', id), updateData);
  };

  const deleteBookmark = async (id: string) => {
    await deleteDoc(doc(db, 'bookmarks', id));
  };

  const updateNotes = async (id: string, notes: string) => {
    await updateDoc(doc(db, 'bookmarks', id), { notes });
  };


  const customCollisionStrategy = (args: any) => {
    if (expandedFolderId) {
      return closestCenter(args);
    }
    return closestCorners(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    const draggedBookmarkId = active.id as string;
    const overId = over ? (over.id as string) : null;
    const draggedBookmark = bookmarks.find(b => b.id === draggedBookmarkId);
    const overBookmark = bookmarks.find(b => b.id === overId);

    // Eject from folder logic: if dropped outside or on the remove zone
    if ((!overId || overId === 'remove-from-folder' || overId === 'dashboard-background') && draggedBookmark && draggedBookmark.parentId) {
      const folderId = draggedBookmark.parentId;
      const folder = bookmarks.find(b => b.id === folderId);

      // Move to the current page and remove parent
      await updateDoc(doc(db, 'bookmarks', draggedBookmarkId), {
        parentId: null,
        page: activePage,
        order: bookmarks.filter(b => (b.page || 'dashboard') === activePage && !b.parentId && (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))).length
      });

      // Auto-dissolve: if only 1 child remains after ejection, promote it and delete folder
      const remainingChildren = bookmarks.filter(b => b.parentId === folderId && b.id !== draggedBookmarkId);
      if (remainingChildren.length === 1) {
        await updateDoc(doc(db, 'bookmarks', remainingChildren[0].id), {
          parentId: null,
          page: folder?.page || 'dashboard',
          order: folder?.order ?? 0,
        });
        await deleteDoc(doc(db, 'bookmarks', folderId));
      }

      setExpandedFolderId(null);
      return;
    }

    if (overId && PAGE_IDS.includes(overId)) {
      const targetPage = overId;
      const bookmark = bookmarks.find(b => b.id === draggedBookmarkId);
      if (bookmark && (bookmark.page || 'dashboard') !== targetPage) {
        setBookmarks(prev => prev.map(b => b.id === draggedBookmarkId ? { ...b, page: targetPage } : b));
        await updateDoc(doc(db, 'bookmarks', draggedBookmarkId), { page: targetPage });
        setActivePage(targetPage);
      }
      return;
    }

    // Dock drop logic disabled for stability during reorder debugging
    if (false && (overId === 'dock' || overId === 'dock_center' || overId === 'dock_right' || (overBookmark && (overBookmark.page === 'dock' || overBookmark.page === 'dock_center' || overBookmark.page === 'dock_right')))) {
      const targetPage = (overId === 'dock' || overId === 'dock_center' || overId === 'dock_right') ? overId as string : overBookmark!.page!;
      const targetDockBookmarks = bookmarks.filter(b => b.page === targetPage).sort((a, b) => {
        if (a.pinToEnd !== b.pinToEnd) return a.pinToEnd ? 1 : -1;
        return (a.order ?? 0) - (b.order ?? 0);
      });

      const batch = writeBatch(db);

      if (overId === 'dock' || overId === 'dock_center' || overId === 'dock_right') {
        batch.update(doc(db, 'bookmarks', draggedBookmarkId), {
          page: targetPage,
          parentId: null,
          order: targetDockBookmarks.length
        });
      } else {
        const oldIdx = targetDockBookmarks.findIndex(b => b.id === draggedBookmarkId);
        const newIdx = targetDockBookmarks.findIndex(b => b.id === overId);

        if (oldIdx !== -1) {
          const reordered = arrayMove(targetDockBookmarks, oldIdx, newIdx);
          reordered.forEach((b, idx) => {
            batch.update(doc(db, 'bookmarks', b.id), { order: idx });
          });
        } else {
          batch.update(doc(db, 'bookmarks', draggedBookmarkId), { page: targetPage, parentId: null, order: 0 });
        }
      }
      await batch.commit();
      return;
    }

    // Move OUT of dock logic: If dragged from dock and dropped on grid/dashboard
    if (draggedBookmark && (draggedBookmark.page === 'dock' || draggedBookmark.page === 'dock_center' || draggedBookmark.page === 'dock_right')) {
      const isOverGrid = overId === 'dashboard' || (overBookmark && overBookmark.page !== 'dock' && overBookmark.page !== 'dock_center' && overBookmark.page !== 'dock_right');
      if (isOverGrid) {
        await updateDoc(doc(db, 'bookmarks', draggedBookmarkId), {
          page: activePage,
          parentId: null,
          order: bookmarks.filter(b => (b.page || 'dashboard') === activePage && !b.parentId && (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))).length
        });
        return;
      }
    }

    // 5. Normal Reordering (within the same container)
    let targetId = overId;
    
    const pageBookmarks = bookmarks.filter(b => 
      (expandedFolderId 
        ? b.parentId === expandedFolderId 
        : ((b.page || 'dashboard') === activePage && !b.parentId)) &&
      (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))
    );

    const oldIndex = pageBookmarks.findIndex(b => b.id === draggedBookmarkId);
    let newIndex = pageBookmarks.findIndex(b => b.id === targetId);
    
    // If we didn't drop on a specific sortable item (e.g. dropped on background or top bar), 
    // find the logical nearest neighbor to determine the new position.
    if (newIndex === -1) {
      const activeRect = event.active.rect.current?.translated;
      if (activeRect) {
        const ax = activeRect.left + activeRect.width / 2;
        const ay = activeRect.top + activeRect.height / 2;
        
        let minD = Infinity;
        let closestIdx = -1;
        
        pageBookmarks.forEach((b, idx) => {
          const el = document.getElementById(b.id);
          if (el) {
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const d = Math.sqrt(Math.pow(ax - cx, 2) + Math.pow(ay - cy, 2));
            if (d < minD) { minD = d; closestIdx = idx; }
          }
        });
        if (closestIdx !== -1) newIndex = closestIdx;
      }
    }

    if (newIndex === -1 || oldIndex === -1 || (oldIndex === newIndex && targetId !== draggedBookmarkId)) return;

    // Special Case: Folder dropping (Disabled for stability during reorder debugging)
    /*
    const targetBookmark = bookmarks.find(b => b.id === targetId);
    if (targetBookmark && targetBookmark.type === 'folder' && draggedBookmarkId !== targetId) {
      await updateDoc(doc(db, 'bookmarks', draggedBookmarkId), {
        parentId: targetId,
        page: 'hidden',
        order: bookmarks.filter(b => b.parentId === targetId).length
      });
      return;
    }
    */

    // Perform Reorder
    const reordered = arrayMove([...pageBookmarks], oldIndex, newIndex);
    const batch = writeBatch(db);
    
    reordered.forEach((b, index) => {
      batch.update(doc(db, 'bookmarks', b.id), { order: index });
    });
    
    await batch.commit();
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  }, []);

  const handleBookmarkClick = (id: string, e?: React.MouseEvent) => {
    if (activeId) return;
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;

    if (e?.ctrlKey || e?.metaKey) {
      e.preventDefault();
      e.stopPropagation();

      const selectable = rootBookmarks;
      if (lastSelectedId && selectedBookmarkIdsState.includes(lastSelectedId)) {
        const startIdx = selectable.findIndex(b => b.id === lastSelectedId);
        const endIdx = selectable.findIndex(b => b.id === id);

        if (startIdx !== -1 && endIdx !== -1) {
          const min = Math.min(startIdx, endIdx);
          const max = Math.max(startIdx, endIdx);
          const rangeIds = selectable.slice(min, max + 1).map(b => b.id);

          setSelectedBookmarkIds(prev => {
            const next = [...new Set([...prev, ...rangeIds])];
            return next;
          });
        }
      } else {
        setSelectedBookmarkIds(prev => prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]);
      }
      setLastSelectedId(id);
      return;
    }

    // Clear selection if clicking without ctrl
    if (selectedBookmarkIdsState.length > 0) {
      setSelectedBookmarkIds([]);
      setLastSelectedId(null);
    }

    if (bookmark.type === 'folder') {
      updateDashboard({ expandedFolderId: id });
      setHoveredBookmark(null);
    }
    else if (bookmark.isDashboardWidget || bookmark.type === 'note') setExpandedId(id);
    else if (e?.shiftKey) setExpandedId(id); // Allow shift+click to open notes for any icon
    else window.location.href = bookmark.url;
  };

  const handleEditRequest = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) { setEditData(bookmark); setIsModalOpen(true); }
  };

  const rootBookmarks = bookmarks.filter(b =>
    (expandedFolderId
      ? b.parentId === expandedFolderId
      : ((b.page || 'dashboard') === activePage && !b.parentId)) &&
    (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))
  );

  const dockBookmarks = bookmarks.filter(b => b.page === 'dock' && (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))).sort((a, b) => {
    if (a.pinToEnd !== b.pinToEnd) return a.pinToEnd ? 1 : -1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const dockCenterBookmarks = bookmarks.filter(b => b.page === 'dock_center' && (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))).sort((a, b) => {
    if (a.pinToEnd !== b.pinToEnd) return a.pinToEnd ? 1 : -1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const dockRightBookmarks = bookmarks.filter(b => b.page === 'dock_right' && (b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === 'default'))).sort((a, b) => {
    if (a.pinToEnd !== b.pinToEnd) return a.pinToEnd ? 1 : -1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  // Dynamic icon sizing for docks - based on TOTAL icons across all sections
  const totalDockIcons = dockBookmarks.length + dockCenterBookmarks.length + dockRightBookmarks.length;
  const calculateDockItemSize = (count: number) => {
    if (isMobile) {
      if (count <= 8) return 48;
      if (count <= 16) return 36;
      return 28;
    }
    if (count <= 6) return 56;
    if (count <= 12) return 42;
    if (count <= 18) return 32;
    if (count <= 24) return 24;
    if (count <= 32) return 20;
    return 16;
  };

  const dockItemSize = calculateDockItemSize(totalDockIcons);
  const dockCenterItemSize = dockItemSize;
  const dockRightItemSize = dockItemSize;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isModalOpen || isSettingsOpen || isBgModalOpen || contextMenu) return;

      const navigableBookmarks = [...rootBookmarks, ...dockBookmarks, ...dockCenterBookmarks, ...dockRightBookmarks];
      if (navigableBookmarks.length === 0) return;

      const currentIndex = keyboardSelectedId ? navigableBookmarks.findIndex(b => b.id === keyboardSelectedId) : -1;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = currentIndex < navigableBookmarks.length - 1 ? currentIndex + 1 : 0;
        setKeyboardSelectedId(navigableBookmarks[nextIndex].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = navigableBookmarks.length - 1;
        setKeyboardSelectedId(navigableBookmarks[prevIndex].id);
      } else if (e.key === 'Enter') {
        if (keyboardSelectedId) {
          e.preventDefault();
          handleBookmarkClick(keyboardSelectedId);
        }
      } else if (e.key === 'Backspace') {
        if (expandedFolderId) {
          e.preventDefault();
          const currentFolder = bookmarks.find(b => b.id === expandedFolderId);
          setExpandedFolderId(currentFolder?.parentId || null);
          setKeyboardSelectedId(null);
        } else if (keyboardSelectedId) {
          e.preventDefault();
          setKeyboardSelectedId(null);
        }
      } else if (e.key === 'Delete') {
        if (selectedBookmarkIdsState.length > 0) {
          e.preventDefault();
          if (window.confirm(`Delete ${selectedBookmarkIdsState.length} selected items?`)) {
            selectedBookmarkIdsState.forEach(id => deleteBookmark(id));
            setSelectedBookmarkIds([]);
          }
        }
      }
    };

    const handleGlobalClick = () => {
      setKeyboardSelectedId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleGlobalClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [rootBookmarks, dockBookmarks, keyboardSelectedId, isModalOpen, isSettingsOpen, isBgModalOpen, contextMenu, handleBookmarkClick, expandedFolderId]);

  const totalItems = rootBookmarks.length + 1; // +1 for the 'Add' button

  // Balanced grid math: try to make the grid roughly square-ish based on available space
  const calendarWidth = (activePage === 'dashboard' && !isMobile) ? 320 : 0;
  const layoutPaddingX = isMobile ? 32 : 160;
  const layoutPaddingY = isMobile ? 200 : 300;
  const availW = windowWidth - calendarWidth - layoutPaddingX;
  const availH = window.innerHeight - layoutPaddingY;
  const containerAspect = availW / availH;

  // Calculate columns to match the screen's aspect ratio
  let dynamicCols = Math.ceil(Math.sqrt(totalItems * containerAspect));
  dynamicCols = isMobile
    ? 4
    : Math.max(6, Math.min(12, dynamicCols));
  const dynamicRows = Math.ceil(totalItems / dynamicCols);

  const gap = 24;
  // Calculate size to fit both width and height constraints
  const sizeToFitW = (availW - (dynamicCols - 1) * gap) / dynamicCols;
  const sizeToFitH = (availH - (dynamicRows - 1) * gap) / dynamicRows;

  const iconSize = Math.min(120, Math.max(48, Math.min(sizeToFitW, sizeToFitH)));

  const expandedBookmark = bookmarks.find(b => b.id === expandedId);
  const activeBookmark = bookmarks.find(b => b.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={setDashboardRef}
        className="dashboard-container"
        style={{ overflowX: 'hidden' }}
      >
        <motion.div
          id="top-bar"
          animate={{
            opacity: isZenMode ? 0 : 1,
            y: isZenMode ? -20 : 0,
            pointerEvents: isZenMode ? 'none' : 'auto'
          }}
          transition={{ duration: 0.5 }}
          style={{ position: 'relative', zIndex: 10, width: '100%', left: 0, top: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <TopBar
            onAddClick={() => setIsModalOpen(true)}
            onSettingsClick={() => setIsSettingsOpen(true)}
            activePage={activePage}
            onPageChange={(page) => {
              updateDashboard({ activePage: page, expandedFolderId: null });
            }}
            isDragging={!!activeId}
          />
        </motion.div>

        {/* Background Layer - Handles Zen Mode Toggling */}
        <div
          onClick={handleBgClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            cursor: 'default'
          }}
        >
          {backgrounds.map((bg, index) => {
            const isActive = previewBgIndex !== null ? index === previewBgIndex : index === bgIndex;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1 : 1.05
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  display: isActive || (previewBgIndex === null && index === (bgIndex - 1 + backgrounds.length) % backgrounds.length) ? 'block' : 'none'
                }}
              >
                {bg.startsWith('youtube:') ? (
                  <iframe
                    id={index === bgIndex ? 'bg-video-iframe' : undefined}
                    src={`https://www.youtube.com/embed/${bg.split(':')[1]}?autoplay=1&mute=1&loop=1&playlist=${bg.split(':')[1]}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '100vw',
                      height: '56.25vw',
                      minHeight: '100vh',
                      minWidth: '177.77vh',
                      transform: 'translate(-50%, -50%)',
                      border: 'none',
                      pointerEvents: 'none',
                    }}
                    allow="autoplay; encrypted-media"
                    title={`background-video-${index}`}
                  />
                ) : (
                  <img
                    src={bg}
                    className="background-image"
                    alt="background"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

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
              animate={{
                opacity: isZenMode ? 0 : 1,
                scale: isZenMode ? 0.98 : 1,
                y: 0,
                pointerEvents: isZenMode ? 'none' : 'auto'
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              style={{
                width: '100%',
                minHeight: '100vh',
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: activePage === 'whiteboard' ? '0' : '15vh',
                paddingBottom: activePage === 'whiteboard' ? '0' : '100px',
                overflowY: activePage === 'whiteboard' ? 'hidden' : 'auto',
                overflowX: 'hidden',
                zIndex: 1,
              }}
            >
              {activePage === 'habits' ? (
                <ErrorBoundary>
                  <HabitsView />
                </ErrorBoundary>
              ) : activePage === 'whiteboard' ? (
                <ErrorBoundary>
                  <WhiteboardView />
                </ErrorBoundary>
              ) : activePage === 'calendar' ? (
                <ErrorBoundary>
                  <CalendarView />
                </ErrorBoundary>
              ) : activePage === 'goal' ? (
                <ErrorBoundary>
                  <GoalView />
                </ErrorBoundary>
              ) : (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '20px' : '40px',
                    width: '100%',
                    maxWidth: '1600px',
                    justifyContent: 'center',
                    padding: isMobile ? '0 16px' : '0 40px',
                  }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <SearchBar
                      preview={hoveredBookmark}
                      goal={showGoalMarquee && goals.length > 0 ? goals[currentGoalIndex]?.text : null}
                      goalCycleCount={goalCycleCount}
                      goalMarqueeRepeatCount={goalMarqueeRepeatCount}
                    />

                    {expandedFolderId ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          marginTop: '20px',
                          marginBottom: '20px',
                          width: '100%',
                          maxWidth: `${dynamicCols * iconSize + (dynamicCols - 1) * gap}px`,
                          justifyContent: 'flex-start',
                          padding: '0 12px',
                        }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.15)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const currentFolder = bookmarks.find(b => b.id === expandedFolderId);
                            updateDashboard({ expandedFolderId: currentFolder?.parentId || null });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          }}
                          title="Back"
                        >
                          <ChevronLeft size={22} strokeWidth={2.5} />
                        </motion.button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {isEditingTitle ? (
                            <input
                              autoFocus
                              value={editingTitleValue}
                              onChange={(e) => setEditingTitleValue(e.target.value)}
                              onBlur={async () => {
                                if (expandedFolderId && editingTitleValue.trim()) {
                                  await updateDoc(doc(db, 'bookmarks', expandedFolderId), { title: editingTitleValue });
                                }
                                setIsEditingTitle(false);
                              }}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  if (expandedFolderId && editingTitleValue.trim()) {
                                    await updateDoc(doc(db, 'bookmarks', expandedFolderId), { title: editingTitleValue });
                                  }
                                  setIsEditingTitle(false);
                                } else if (e.key === 'Escape') {
                                  setIsEditingTitle(false);
                                }
                              }}
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                padding: '4px 12px',
                                fontSize: '24px',
                                fontWeight: 600,
                                color: 'white',
                                outline: 'none',
                                width: 'auto',
                                minWidth: '200px'
                              }}
                            />
                          ) : (
                            <h1
                              onClick={() => {
                                setIsEditingTitle(true);
                                setEditingTitleValue(bookmarks.find(b => b.id === expandedFolderId)?.title || '');
                              }}
                              style={{
                                fontSize: '24px',
                                fontWeight: 600,
                                color: 'white',
                                margin: 0,
                                letterSpacing: '-0.3px',
                                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                cursor: 'pointer'
                              }}
                            >
                              {bookmarks.find(b => b.id === expandedFolderId)?.title}
                            </h1>
                          )}

                          <div style={{
                            height: '24px',
                            width: '1px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            margin: '0 8px'
                          }} />

                          {isEditingDesc ? (
                            <input
                              autoFocus
                              value={editingDescValue}
                              onChange={(e) => setEditingDescValue(e.target.value)}
                              onBlur={async () => {
                                if (expandedFolderId) {
                                  await updateDoc(doc(db, 'bookmarks', expandedFolderId), { description: editingDescValue });
                                }
                                setIsEditingDesc(false);
                              }}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  if (expandedFolderId) {
                                    await updateDoc(doc(db, 'bookmarks', expandedFolderId), { description: editingDescValue });
                                  }
                                  setIsEditingDesc(false);
                                } else if (e.key === 'Escape') {
                                  setIsEditingDesc(false);
                                }
                              }}
                              placeholder="Add a description..."
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                outline: 'none',
                                minWidth: '200px'
                              }}
                            />
                          ) : (
                            <span
                              onClick={() => {
                                setIsEditingDesc(true);
                                setEditingDescValue(bookmarks.find(b => b.id === expandedFolderId)?.description || '');
                              }}
                              style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.5)',
                                cursor: 'pointer',
                                fontStyle: bookmarks.find(b => b.id === expandedFolderId)?.description ? 'normal' : 'italic'
                              }}
                            >
                              {bookmarks.find(b => b.id === expandedFolderId)?.description || 'Add description...'}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                        justifyContent: 'center',
                        gap: `${Math.max(4, dockItemSize / 4)}px`,
                        width: '100%',
                        maxWidth: `${dynamicCols * iconSize + (dynamicCols - 1) * gap}px`,
                        margin: '0 auto',
                        boxSizing: 'border-box',
                        marginTop: '20px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <Dock
                            id="dock"
                            align="left"
                            items={dockBookmarks}
                            keyboardSelectedId={keyboardSelectedId}
                            onContextMenu={handleContextMenu}
                            onBookmarkClick={handleBookmarkClick}
                            onMouseEnter={(item) => !isMobile && setHoveredBookmark({
                              id: item.id,
                              title: item.title,
                              url: item.url,
                              iconType: item.iconType,
                              lucideIcon: item.lucideIcon,
                              iconColor: item.iconColor,
                              customIconUrl: item.customIconUrl,
                              priorityText: item.priorityText
                            })}
                            onMouseLeave={() => setHoveredBookmark(null)}
                            activeId={activeId}
                            itemSize={dockItemSize}
                          />
                        </div>

                        {!isMobile && (
                          <div style={{
                            width: '1px',
                            height: '24px',
                            background: 'rgba(255,255,255,0.2)',
                            margin: '0 12px',
                            alignSelf: 'center'
                          }} />
                        )}

                        <div style={{ flex: 1 }}>
                          <Dock
                            id="dock_center"
                            align="center"
                            items={dockCenterBookmarks}
                            keyboardSelectedId={keyboardSelectedId}
                            onContextMenu={handleContextMenu}
                            onBookmarkClick={handleBookmarkClick}
                            onMouseEnter={(item) => !isMobile && setHoveredBookmark({
                              id: item.id,
                              title: item.title,
                              url: item.url,
                              iconType: item.iconType,
                              lucideIcon: item.lucideIcon,
                              iconColor: item.iconColor,
                              customIconUrl: item.customIconUrl,
                              priorityText: item.priorityText
                            })}
                            onMouseLeave={() => setHoveredBookmark(null)}
                            activeId={activeId}
                            itemSize={dockCenterItemSize}
                          />
                        </div>

                        {!isMobile && (
                          <div style={{
                            width: '1px',
                            height: '24px',
                            background: 'rgba(255,255,255,0.2)',
                            margin: '0 12px',
                            alignSelf: 'center'
                          }} />
                        )}

                        <div style={{ flex: 1 }}>
                          <Dock
                            id="dock_right"
                            align="right"
                            items={dockRightBookmarks}
                            keyboardSelectedId={keyboardSelectedId}
                            onContextMenu={handleContextMenu}
                            onBookmarkClick={handleBookmarkClick}
                            onMouseEnter={(item) => !isMobile && setHoveredBookmark({
                              id: item.id,
                              title: item.title,
                              url: item.url,
                              iconType: item.iconType,
                              lucideIcon: item.lucideIcon,
                              iconColor: item.iconColor,
                              customIconUrl: item.customIconUrl,
                              priorityText: item.priorityText
                            })}
                            onMouseLeave={() => setHoveredBookmark(null)}
                            activeId={activeId}
                            itemSize={dockRightItemSize}
                          />
                        </div>
                      </div>
                    )}

                    {rootBookmarks.length === 0 && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: '40px',
                          marginBottom: '-20px'
                        }}
                      >
                        <p style={{ fontSize: '16px', fontWeight: 300, color: 'rgba(255,255,255,0.4)' }}>
                          This workspace is empty. Click 'Add' below to get started.
                        </p>
                      </motion.div>
                    )}

                    {!isLoading && (
                      <SortableContext
                        items={rootBookmarks.map(b => b.id)}
                        strategy={rectSortingStrategy}
                      >
                        <ErrorBoundary>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(${dynamicCols}, ${iconSize}px)`,
                              gap: `${gap}px`,
                              justifyContent: 'center',
                              width: '100%',
                              padding: '20px',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {rootBookmarks.map((bookmark) => (
                              <SortableBookmarkItem
                                key={bookmark.id}
                                bookmark={bookmark}
                                folderChildren={bookmarks.filter(b => b.parentId === bookmark.id)}
                                onContextMenu={handleContextMenu}
                                onClick={handleBookmarkClick}
                                isSelected={selectedBookmarkIdsState.includes(bookmark.id) || keyboardSelectedId === bookmark.id}
                                onMouseEnter={() => !isMobile && setHoveredBookmark({
                                  id: bookmark.id,
                                  title: bookmark.title,
                                  url: bookmark.url,
                                  iconType: bookmark.iconType,
                                  lucideIcon: bookmark.lucideIcon,
                                  iconColor: bookmark.iconColor,
                                  customIconUrl: bookmark.customIconUrl,
                                  priorityText: bookmark.priorityText
                                })}
                                onMouseLeave={() => setHoveredBookmark(null)}
                                isDragging={activeId === bookmark.id}
                                size={iconSize}
                              />
                            ))}

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setEditData(null); setIsModalOpen(true); }}
                              className="glass-card"
                              style={{
                                width: `${iconSize}px`,
                                height: `${iconSize}px`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255, 255, 255, 0.4)',
                                borderRadius: `${20 * (iconSize / 120)}px`,
                              }}
                            >
                              <Plus size={32 * (iconSize / 120)} />
                              <span style={{ fontSize: `${13 * (iconSize / 120)}px`, marginTop: '8px' }}>Add</span>
                            </motion.button>
                          </div>
                        </ErrorBoundary>
                      </SortableContext>
                    )}
                  </div>

                  <div style={{
                    flexShrink: 0,
                    marginTop: isMobile ? '40px' : '20px',
                    display: 'block',
                    width: isMobile ? '100%' : 'auto'
                  }}>
                    {expandedFolderId ? (
                      <GroupNotes
                        folderId={expandedFolderId}
                        notes={bookmarks.find(b => b.id === expandedFolderId)?.notes || ''}
                        onUpdate={(notes) => updateNotes(expandedFolderId, notes)}
                        folder={bookmarks.find(b => b.id === expandedFolderId)}
                      />
                    ) : (
                      <CalendarWidget
                        hoveredBookmark={hoveredBookmark}
                        widgetPauseMins={widgetPauseMins}
                        isPaused={isWidgetPaused}
                        pauseSecondsLeft={widgetPauseSecondsLeft}
                        onPauseToggle={toggleWidgetPause}
                        onCancelPause={() => {
                          updateDashboard({ isWidgetPaused: false, widgetPauseUntil: 0 });
                        }}
                        activeTab={activeWidgetTab}
                        onTabChange={(tab) => updateDashboard({ activeWidgetTab: tab })}
                        isCollapsed={isWidgetCollapsed}
                        onCollapseChange={(collapsed) => updateDashboard({ isWidgetCollapsed: collapsed })}
                      />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>







        {/* Perfectly centered background controls */}
        <motion.div
          id="bottom-pill"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isZenMode ? 0 : 1,
            y: isZenMode ? 40 : 0,
            pointerEvents: isZenMode ? 'none' : 'auto'
          }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: activePage === 'dashboard' ? 'calc(50% - 180px)' : '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Section: Main Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px' }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevBg}
              className="control-btn"
              style={{ color: 'white', cursor: 'pointer', padding: '10px' }}
            >
              <ChevronLeft size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => updateDashboard({ isPaused: !isPaused })}
              className="control-btn"
              style={{ color: 'white', cursor: 'pointer', padding: '10px' }}
            >
              {isPaused ? <Play size={20} fill="white" /> : <Pause size={20} fill="white" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextBg}
              className="control-btn"
              style={{ color: 'white', cursor: 'pointer', padding: '10px' }}
            >
              <ChevronRight size={20} />
            </motion.button>

            <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsBgModalOpen(true)}
              title="Choose Background"
              className="control-btn"
              style={{ color: 'white', cursor: 'pointer', padding: '10px' }}
            >
              <ImageIcon size={20} />
            </motion.button>
          </div>

          {/* Bottom Section 2: Seek Bar (Only for YouTube) */}
          {backgrounds[bgIndex]?.startsWith('youtube:') && (
            <div style={{
              marginTop: '4px',
              padding: '8px 12px 12px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, color: 'white' }}>
                <span>{formatTime(videoTime.current)} / {formatTime(videoTime.total)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={videoProgress}
                onMouseDown={() => setIsSeeking(true)}
                onChange={handleSeek}
                onMouseUp={handleSeekEnd}
                style={{
                  width: '100%',
                  height: '4px',
                  background: `linear-gradient(to right, #7c4dff ${videoProgress}%, rgba(255,255,255,0.1) ${videoProgress}%)`,
                  borderRadius: '2px',
                  appearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                className="video-seek-bar"
              />
            </div>
          )}
        </motion.div>

        <style>{`
          .video-seek-bar::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #7c4dff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(124, 77, 255, 0.5);
            border: 2px solid white;
          }
          .video-seek-bar::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: #7c4dff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(124, 77, 255, 0.5);
            border: 2px solid white;
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isZenMode ? 0 : 0.3 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            bottom: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'white',
            zIndex: 9,
            pointerEvents: 'none',
          }}
        >
          VivaldiDash
        </motion.div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
        {activeBookmark ? (
          <div style={{ cursor: 'grabbing', transform: 'scale(1.02)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}>
            {activeBookmark.type === 'folder' ? (
              <FolderCard id={activeBookmark.id} title={activeBookmark.title} children={bookmarks.filter(b => b.parentId === activeBookmark.id)} onContextMenu={() => { }} onClick={() => { }} />
            ) : (
              <BookmarkCard {...activeBookmark} onClick={() => { }} onContextMenu={() => { }} />
            )}
          </div>
        ) : null}
      </DragOverlay>

      <AnimatePresence>
        {/* FolderExpandedView removed in favor of drill-down navigation */}
      </AnimatePresence>

      <AnimatePresence>
        {expandedBookmark && (
          <ExpandedView
            bookmark={expandedBookmark}
            onClose={() => setExpandedId(null)}
            onSaveNotes={(notes) => updateNotes(expandedBookmark.id, notes)}
          />
        )}
      </AnimatePresence>

      <BackgroundSelectorModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        backgrounds={backgrounds}
        currentIndex={bgIndex}
        onSelect={(index) => updateDashboard({ bgIndex: index })}
        onHover={(index) => setPreviewBgIndex(index)}
        onDelete={deleteBackground}
        onAdd={addBackground}
        bgRotationInterval={bgRotationInterval}
        onRotationIntervalChange={async (val) => {
          setBgRotationInterval(val);
          await setDoc(doc(db, 'settings', 'dashboard'), { bgRotationInterval: val }, { merge: true });
        }}
      />

      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onAdd={async (title, url, iconProps) => {
          const newId = await addBookmark(title, url, iconProps);
          if (iconProps?.type === 'folder') {
            updateDashboard({ expandedFolderId: newId });
          }
        }}
        onEdit={editBookmark}
        editData={editData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gridColumns={gridColumns}
        onGridColumnsChange={async (cols) => {
          setGridColumns(cols);
          await setDoc(doc(db, 'settings', 'dashboard'), { gridColumns: cols }, { merge: true });
        }}
        showGoalMarquee={showGoalMarquee}
        onShowGoalMarqueeChange={async (val) => {
          setShowGoalMarquee(val);
          await setDoc(doc(db, 'settings', 'dashboard'), { showGoalMarquee: val }, { merge: true });
        }}
        goalMarqueeInterval={goalMarqueeInterval}
        onGoalMarqueeIntervalChange={async (val) => {
          setGoalMarqueeInterval(val);
          await setDoc(doc(db, 'settings', 'dashboard'), { goalMarqueeInterval: val }, { merge: true });
        }}
        goalMarqueeRepeatCount={goalMarqueeRepeatCount}
        onGoalMarqueeRepeatCountChange={async (val) => {
          setGoalMarqueeRepeatCount(val);
          await setDoc(doc(db, 'settings', 'dashboard'), { goalMarqueeRepeatCount: val }, { merge: true });
        }}
        widgetPauseMins={widgetPauseMins}
        onWidgetPauseMinsChange={async (val) => {
          setWidgetPauseMins(val);
          await setDoc(doc(db, 'settings', 'dashboard'), { widgetPauseMins: val }, { merge: true });
        }}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceChange={(id) => updateDashboard({ activeWorkspaceId: id })}
        onCreateWorkspace={async (name) => {
          const docRef = await addDoc(collection(db, 'workspaces'), { name });
          setActiveWorkspaceId(docRef.id);
        }}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={!!contextMenu}
          isFolder={bookmarks.find(b => b.id === contextMenu.id)?.type === 'folder' || false}
          hasSelection={selectedBookmarkIdsState.length > 0}
          onClose={() => setContextMenu(null)}
          onRemove={() => deleteBookmark(contextMenu.id)}
          onEdit={() => handleEditRequest(contextMenu.id)}
          onExpand={() => setExpandedId(contextMenu.id)}
          onSelectIcon={() => {
            setSelectedBookmarkIds(prev =>
              prev.includes(contextMenu.id)
                ? prev.filter(id => id !== contextMenu.id)
                : [...prev, contextMenu.id]
            );
          }}
          onOpenNotes={() => setExpandedId(contextMenu.id)}
          onOpenLink={() => {
            const bookmark = bookmarks.find(b => b.id === contextMenu.id);
            if (bookmark && bookmark.url) {
              const url = bookmark.url.startsWith('http') ? bookmark.url : `https://${bookmark.url}`;
              window.open(url, '_blank');
            }
          }}
          hasParent={!!bookmarks.find(b => b.id === contextMenu.id)?.parentId}
          onMoveUp={async () => {
            const id = contextMenu.id;
            const bookmark = bookmarks.find(b => b.id === id);
            if (!bookmark || !bookmark.parentId) return;

            const parentFolder = bookmarks.find(b => b.id === bookmark.parentId);
            const grandparentId = parentFolder?.parentId || null;

            await updateDoc(doc(db, 'bookmarks', id), {
              parentId: grandparentId ? grandparentId : deleteField(),
              page: grandparentId ? 'hidden' : (parentFolder?.page || 'dashboard'),
              order: bookmarks.filter(b => grandparentId ? b.parentId === grandparentId : !b.parentId).length
            });

            if (expandedFolderId === bookmark.parentId) {
              // Optionally stay or go back. The user said "send icon back", usually implies moving it OUT of current view.
            }
          }}
          onAddSelectedToGroup={async () => {
            const currentSelected = selectedBookmarkIdsRef.current;
            if (currentSelected.length > 0) {
              const batch = writeBatch(db);
              currentSelected.forEach(id => {
                batch.update(doc(db, 'bookmarks', id), {
                  parentId: contextMenu.id,
                  page: 'hidden'
                });
              });
              await batch.commit();
              setSelectedBookmarkIds([]);
            }
          }}
          onSelectGroup={() => updateDashboard({ nestingGroupId: contextMenu.id })}
          onAddSelectedGroupToGroup={async () => {
            if (nestingGroupId && nestingGroupId !== contextMenu.id) {
              await updateDoc(doc(db, 'bookmarks', nestingGroupId), {
                parentId: contextMenu.id,
                page: 'hidden'
              });
              updateDashboard({ nestingGroupId: null });
            }
          }}
          selectedGroupName={nestingGroupId ? bookmarks.find(b => b.id === nestingGroupId)?.title : null}
          onBreakApartGroup={async () => {
            const folderId = contextMenu.id;
            const children = bookmarks.filter(b => b.parentId === folderId);
            const folder = bookmarks.find(b => b.id === folderId);
            const targetParentId = folder?.parentId || null;

            const batch = writeBatch(db);
            children.forEach(child => {
              batch.update(doc(db, 'bookmarks', child.id), {
                parentId: targetParentId ? targetParentId : deleteField(),
                page: targetParentId ? 'hidden' : (folder?.page || 'dashboard')
              });
            });
            batch.delete(doc(db, 'bookmarks', folderId));
            await batch.commit();
          }}
          onCreateGroupWithSelected={async () => {
            const targetBookmark = bookmarks.find(b => b.id === contextMenu.id);
            if (!targetBookmark) return;

            const targetOrder = targetBookmark.order ?? 0;
            const parentId = expandedFolderId || targetBookmark.parentId || null;

            const folderRef = await addDoc(collection(db, 'bookmarks'), {
              title: 'Group',
              url: '',
              type: 'folder',
              order: targetOrder,
              page: parentId ? 'hidden' : activePage,
              workspaceId: activeWorkspaceId,
              parentId: parentId
            });

            const batch = writeBatch(db);
            const currentSelected = selectedBookmarkIdsRef.current;
            const idsToMove = Array.from(new Set([...currentSelected, contextMenu.id]));

            idsToMove.forEach(id => {
              batch.update(doc(db, 'bookmarks', id), {
                parentId: folderRef.id,
                page: 'hidden'
              });
            });

            await batch.commit();
            setSelectedBookmarkIds([]);
          }}
        />
      )}
      {activeId && (
        <DragOverlay adjustScale={true} dropAnimation={null}>
          {(() => {
            const activeBookmark = bookmarks.find(b => b.id === activeId);
            if (!activeBookmark) return null;
            const scale = (iconSize || 120) / 120;
            return (
              <div style={{ 
                transform: 'scale(1.05)', 
                opacity: 0.9,
                cursor: 'grabbing',
                pointerEvents: 'none'
              }}>
                {activeBookmark.type === 'folder' ? (
                  <FolderCard
                    id={activeBookmark.id}
                    title={activeBookmark.title}
                    children={bookmarks.filter(b => b.parentId === activeBookmark.id)}
                    onContextMenu={() => {}}
                    onClick={() => {}}
                    size={iconSize}
                    hideTitle={false}
                  />
                ) : (
                  <BookmarkCard
                    {...activeBookmark}
                    onContextMenu={() => {}}
                    onClick={() => {}}
                    size={iconSize}
                  />
                )}
              </div>
            );
          })()}
        </DragOverlay>
      )}
    </DndContext>
  );
}

export default App;
