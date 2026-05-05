import { useEffect, useState } from 'react';
import { createTLStore, defaultShapeUtils, type TLRecord } from 'tldraw';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Filter out ephemeral local state (like camera position, selection, user cursors)
// We only want to sync the actual drawings and pages.
const isShareable = (record: TLRecord) =>
  ['document', 'page', 'shape', 'asset', 'binding'].includes(record.typeName);

export function useFirebaseStore(documentId: string = 'main') {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      const docRef = doc(db, 'whiteboards', documentId);
      
      // 1. Fetch initial state
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const records = snapshot.data().records as TLRecord[];
        if (records && records.length > 0) {
          store.put(records);
        }
      } else {
        // Initialize empty document in Firestore
        await setDoc(docRef, { records: store.allRecords().filter(isShareable) });
      }
      
      setStoreReady(true);

      // 2. Listen to Firestore changes (Remote -> Local)
      // unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
      //   if (!docSnap.exists() || isSaving) return;
      //   const remoteRecords = docSnap.data().records as TLRecord[];
      //   if (remoteRecords) {
      //     store.mergeRemoteChanges(() => {
      //       store.put(remoteRecords);
      //     });
      //   }
      // });

      // 3. Listen to Tldraw changes (Local -> Remote)
      // let timeout: ReturnType<typeof setTimeout>;
      // unsubscribeStore = store.listen((update) => {
      //   if (update.source !== 'user') return;

      //   clearTimeout(timeout);
      //   timeout = setTimeout(async () => {
      //     isSaving = true;
      //     try {
      //       const shareableRecords = store.allRecords().filter(isShareable);
      //       await setDoc(docRef, { records: shareableRecords }, { merge: true });
      //     } finally {
      //       setTimeout(() => { isSaving = false; }, 500);
      //     }
      //   }, 1000); // 1s debounce to save Firebase quota
      // });
    };

    setup();
  }, [store, documentId]);

  return { store, storeReady };
}
