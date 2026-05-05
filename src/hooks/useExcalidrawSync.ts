import { useEffect, useState, useRef, useCallback } from 'react';
import { doc, getDoc, onSnapshot, setDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useExcalidrawSync(documentId: string = 'main') {
  const [isReady, setIsReady] = useState(false);
  const [initialElements, setInitialElements] = useState<readonly any[]>([]);
  const excalidrawAPIRef = useRef<any | null>(null);
  
  // Unique ID and color for the local user's cursor
  const clientId = useRef(Math.random().toString(36).substring(2, 10)).current;
  const cursorColor = useRef('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')).current;
  
  // Track if a save is currently pending to prevent echo loops
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Throttle cursor updates to Firebase (every 100ms)
  const lastCursorUpdateRef = useRef<number>(0);

  useEffect(() => {
    const docRef = doc(db, 'whiteboards', documentId);
    const cursorsRef = collection(db, 'whiteboards', documentId, 'cursors');
    let unsubscribeSnapshot: () => void;
    let unsubscribeCursors: () => void;

    const setup = async () => {
      // 1. Fetch initial state
      try {
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.elements && Array.isArray(data.elements)) {
            setInitialElements(data.elements);
          }
        }
      } catch (e) {
        console.error("Error fetching initial whiteboard state:", e);
      }
      setIsReady(true);

      // 2. Listen for remote drawing changes
      unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (!docSnap.exists() || isSavingRef.current || !excalidrawAPIRef.current) return;
        
        const data = docSnap.data();
        if (data && data.elements) {
          excalidrawAPIRef.current.updateScene({ elements: data.elements });
        }
      });

      // 3. Listen for remote cursors
      unsubscribeCursors = onSnapshot(cursorsRef, (querySnapshot) => {
        if (!excalidrawAPIRef.current) return;
        
        const collaborators = new Map<string, any>();
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id === clientId) return; // Ignore our own cursor echo
          
          const data = docSnap.data();
          if (data && data.pointer) {
            collaborators.set(docSnap.id, {
              pointer: data.pointer,
              button: data.button || "up",
              username: data.username || "Anonymous",
              color: data.color || "#ff0000"
            });
          }
        });
        
        excalidrawAPIRef.current.updateScene({ collaborators });
      });
    };

    setup();

    // 4. Cleanup: Remove our cursor document when leaving
    const cleanupCursor = async () => {
      try {
        const myCursorRef = doc(db, 'whiteboards', documentId, 'cursors', clientId);
        await deleteDoc(myCursorRef);
      } catch (e) {
        console.error("Failed to cleanup cursor", e);
      }
    };

    window.addEventListener('beforeunload', cleanupCursor);

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeCursors) unsubscribeCursors();
      cleanupCursor();
      window.removeEventListener('beforeunload', cleanupCursor);
    };
  }, [documentId, clientId]);

  // Call this from Excalidraw's onChange prop
  const handleLocalChange = (elements: readonly any[]) => {
    if (!isReady) return;

    // Fast debounce for almost instant syncing (50ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      try {
        const docRef = doc(db, 'whiteboards', documentId);
        const activeElements = elements.filter(el => !el.isDeleted);
        // Clean out undefined variables for Firestore
        const cleanElements = JSON.parse(JSON.stringify(activeElements));
        await setDoc(docRef, { elements: cleanElements }, { merge: true });
      } catch (e) {
        console.error("Failed to save whiteboard to Firebase:", e);
      } finally {
        setTimeout(() => {
          isSavingRef.current = false;
        }, 50);
      }
    }, 50);
  };

  // Call this from Excalidraw's onPointerUpdate prop
  const handlePointerUpdate = useCallback((payload: { pointer: { x: number, y: number }, button: "down" | "up", pointersMap: Map<number, any> }) => {
    const now = Date.now();
    // Throttle cursor sends to 10 frames per second (100ms) to save DB quota
    if (now - lastCursorUpdateRef.current < 100) return;
    
    lastCursorUpdateRef.current = now;
    
    const myCursorRef = doc(db, 'whiteboards', documentId, 'cursors', clientId);
    
    // We intentionally don't await this so it fires instantly in the background
    setDoc(myCursorRef, {
      pointer: payload.pointer,
      button: payload.button,
      color: cursorColor,
      username: "Collaborator",
      lastUpdated: now
    }).catch(e => console.error("Failed to sync cursor", e));
  }, [documentId, clientId, cursorColor]);

  return {
    isReady,
    initialElements,
    setExcalidrawAPI: (api: any) => { excalidrawAPIRef.current = api; },
    handleLocalChange,
    handlePointerUpdate
  };
}
