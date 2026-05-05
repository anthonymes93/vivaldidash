import React from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { useFirebaseStore } from '../hooks/useFirebaseStore';

const WhiteboardView: React.FC = () => {
  // Use our custom Firebase sync hook!
  // This will sync to a Firestore document named "main" in the "whiteboards" collection.
  const { store, storeReady } = useFirebaseStore('main');

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}>
      {/* 
        We use a dark theme to match VivaldiDash. 
        We only render the Tldraw component once the store has fetched initial data from Firebase.
      */}
      {storeReady ? (
        <Tldraw 
          store={store} 
          inferDarkMode={true}
          // Offset the UI so it doesn't overlap with our TopBar
          components={{
            SharePanel: () => (
              <div style={{ pointerEvents: 'all', display: 'flex', gap: '8px' }}>
                <div style={{ 
                  background: 'rgba(124, 77, 255, 0.2)', 
                  color: '#b388ff',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid rgba(124, 77, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#b388ff', marginRight: 6 }} />
                  Live Sync On
                </div>
              </div>
            )
          }}
        />
      ) : (
        <div style={{ 
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' 
        }}>
          LOADING WORKSPACE...
        </div>
      )}
      
      {/* Push the TopBar space down for the Tldraw canvas */}
      <style>{`
        .tl-ui-layout {
          padding-top: 70px !important;
        }
      `}</style>
    </div>
  );
};

export default WhiteboardView;
