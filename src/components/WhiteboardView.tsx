import React from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '../../node_modules/@excalidraw/excalidraw/dist/dev/index.css';
import { useExcalidrawSync } from '../hooks/useExcalidrawSync';

const WhiteboardView: React.FC = () => {
  const { isReady, initialElements, setExcalidrawAPI, handleLocalChange, handlePointerUpdate } = useExcalidrawSync('main');

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}>
      {isReady ? (
        <Excalidraw
          theme="dark"
          zenModeEnabled={false}
          viewModeEnabled={false}
          initialData={{ elements: initialElements }}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          onChange={(elements) => handleLocalChange(elements)}
          onPointerUpdate={handlePointerUpdate}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          LOADING WORKSPACE...
        </div>
      )}
      <style>{`
        .excalidraw {
          --color-background-default: #0f0f13 !important;
        }
        /* Push the UI down so it doesn't overlap with the TopBar */
        .App-menu {
          margin-top: 70px !important;
        }
        .layer-ui__wrapper {
          padding-top: 70px !important;
        }
      `}</style>
    </div>
  );
};

export default WhiteboardView;
