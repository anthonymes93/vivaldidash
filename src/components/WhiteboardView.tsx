import React from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

const WhiteboardView: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}>
      <Excalidraw 
        theme="dark" 
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: true,
            saveAsImage: true
          }
        }}
      />
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
