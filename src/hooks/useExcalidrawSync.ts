import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useExcalidrawSync(documentId: string = 'main') {
  const [isReady, setIsReady] = useState(false);
  const [initialElements, setInitialElements] = useState<readonly any[]>([]);
  const excalidrawAPIRef = useRef<any | null>(null);
  
  // Track if a save is currently pending to prevent echo loops
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'whiteboards', documentId);
    let unsubscribeSnapshot: () => void;

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

      // 2. Listen for remote changes
      unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (!docSnap.exists() || isSavingRef.current || !excalidrawAPIRef.current) return;
        
        const data = docSnap.data();
        if (data && data.elements) {
          excalidrawAPIRef.current.updateScene({ elements: data.elements });
        }
      });
    };

    setup();

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [documentId]);

  // Call this from Excalidraw's onChange prop
  const handleLocalChange = (elements: readonly any[]) => {
    if (!isReady) return;

    // Debounce saves by 1.5 seconds
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      try {
        const docRef = doc(db, 'whiteboards', documentId);
        // We only save the elements. We filter out deleted elements to save space.
        const activeElements = elements.filter(el => !el.isDeleted);
        await setDoc(docRef, { elements: activeElements }, { merge: true });
      } catch (e) {
        console.error("Failed to save whiteboard to Firebase:", e);
      } finally {
        // Wait an extra 500ms before accepting remote snapshots to prevent echo jitter
        setTimeout(() => {
          isSavingRef.current = false;
        }, 500);
      }
    }, 1500);
  };

  return {
    isReady,
    initialElements,
    setExcalidrawAPI: (api: any) => { excalidrawAPIRef.current = api; },
    handleLocalChange
  };
}
