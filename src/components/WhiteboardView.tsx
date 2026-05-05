import React from 'react';
import { Tldraw } from 'tldraw';
import { getAssetUrlsByMetaUrl } from '@tldraw/assets/urls';
import 'tldraw/tldraw.css';

const assetUrls = getAssetUrlsByMetaUrl();

const WhiteboardView: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}>
      <Tldraw 
        persistenceKey="vivaldidash-test-whiteboard"
        inferDarkMode={true}
        assetUrls={assetUrls}
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
