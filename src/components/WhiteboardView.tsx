import React from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';


const WhiteboardView: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}>
      <Tldraw 
        persistenceKey="vivaldidash-test-whiteboard"
        inferDarkMode={true}
      />
      <style>{`
        .tl-ui-layout {
          padding-top: 70px !important;
        }
      `}</style>
    </div>
  );
};

export default WhiteboardView;
