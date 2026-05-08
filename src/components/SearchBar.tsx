import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookmarkIcon from './BookmarkIcon';

interface SearchBarProps {
  preview?: { 
    title: string; 
    url: string;
    iconType?: 'favicon' | 'lucide' | 'custom';
    lucideIcon?: string;
    iconColor?: string;
    customIconUrl?: string;
  } | null;
}

const BRAND_COLORS: Record<string, string> = {
  'Skool': '#4dabf7',
  'YouTube': '#ff0000',
  'Codecademy': '#30da7e',
  'Quo': '#e5ff00',
  'Call Rail': '#007bff',
  'Google Ads': '#4285f4',
  'unbounce': '#0052cc',
  'Mike Andes': '#f0f0f0',
  'Hotjar': '#ff1c5c',
  'Clarity': '#0078d4',
  'ClickUp': '#7b68ee',
  'Notion': '#ffffff',
  'Vapi': '#7c4dff',
  'Retell': '#00d2ff',
  'Calendly': '#006bff',
  'Miro': '#ffd02f',
  'Claude': '#d97757',
  'Optimizer': '#4ecdc4',
  '360nerds': '#ff6b6b',
  'Elevenlabs': '#00ff9f',
  'Gamma': '#ff4757',
  'Instagram': '#e1306c',
};

const SearchBar: React.FC<SearchBarProps> = ({ preview }) => {
  const [query, setQuery] = useState('');
  const [accentColor, setAccentColor] = useState('#7c4dff');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    }
  };

  const getFaviconUrl = (url: string) => {
    if (!url) return '';
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const domain = new URL(fullUrl).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch (e) {
      return `https://ui-avatars.com/api/?name=B&background=random`;
    }
  };

  const faviconUrl = preview ? getFaviconUrl(preview.url) : '';

  useEffect(() => {
    if (!preview) {
      setAccentColor('#7c4dff');
      return;
    }

    if (preview.iconType === 'lucide' && preview.iconColor) {
      setAccentColor(preview.iconColor);
      return;
    }

    const domain = preview.url ? (() => {
      try { return new URL(preview.url.startsWith('http') ? preview.url : `https://${preview.url}`).hostname.toLowerCase(); }
      catch (e) { return ''; }
    })() : '';
    
    // 1. Check the high-priority brand map
    const mappedColor = Object.entries(BRAND_COLORS).find(([name]) => 
      preview.title.toLowerCase().includes(name.toLowerCase()) ||
      (domain && domain.includes(name.toLowerCase()))
    )?.[1];

    if (mappedColor) {
      setAccentColor(mappedColor);
      return;
    }

    const imageSource = preview.iconType === 'custom' && preview.customIconUrl 
      ? preview.customIconUrl 
      : faviconUrl;

    // 2. Try to extract from icon
    if (!imageSource) {
      setAccentColor('#7c4dff');
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        canvas.width = img.width || 64;
        canvas.height = img.height || 64;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        let colors: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          if (data[i+3] < 200) continue;
          
          const r = Math.round(data[i] / 10) * 10;
          const g = Math.round(data[i+1] / 10) * 10;
          const b = Math.round(data[i+2] / 10) * 10;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 30) continue; 

          const key = `${r},${g},${b}`;
          colors[key] = (colors[key] || 0) + 1;
        }
        
        const dominant = Object.entries(colors).sort((a, b) => b[1] - a[1])[0];
        if (dominant) {
          const [r, g, b] = dominant[0].split(',').map(Number);
          setAccentColor(`#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`);
        } else {
          const hash = domain.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
          setAccentColor(`hsl(${Math.abs(hash) % 360}, 70%, 70%)`);
        }
      } catch (e) {
        const hash = domain.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        setAccentColor(`hsl(${Math.abs(hash) % 360}, 70%, 70%)`);
      }
    };
    img.onerror = () => {
      const hash = domain.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
      setAccentColor(`hsl(${Math.abs(hash) % 360}, 70%, 70%)`);
    };
    img.src = imageSource;
  }, [preview, faviconUrl]);

  return (
    <motion.form
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: preview 
          ? `0 0 40px ${accentColor}66, 0 8px 32px rgba(0, 0, 0, 0.3)` 
          : '0 8px 32px rgba(0, 0, 0, 0.2)',
        borderColor: preview ? `${accentColor}44` : 'rgba(255, 255, 255, 0.1)',
      }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSearch}
      className="glass search-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '600px',
        maxWidth: '90%',
        padding: '8px 24px',
        marginBottom: '2vh',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview-icon"
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}
          >
            <BookmarkIcon 
              title={preview.title}
              url={preview.url}
              iconType={preview.iconType}
              lucideIcon={preview.lucideIcon}
              iconColor={preview.iconColor}
              customIconUrl={preview.customIconUrl}
              size={24}
              noBackground={true}
            />
          </motion.div>
        ) : (
          <motion.div
            key="search-icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Search size={20} color="rgba(255, 255, 255, 0.5)" />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={preview ? '' : "Search Yahoo..."}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '18px',
            fontWeight: 300,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
          }}
        />
        
        <AnimatePresence>
          {preview && !query && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{
                position: 'absolute',
                left: '16px',
                pointerEvents: 'none',
                fontSize: '18px',
                fontWeight: 300,
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Go to <span style={{ color: accentColor, fontWeight: 500 }}>{preview.title}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {preview && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: accentColor,
            opacity: 0.8,
            fontWeight: 600
          }}
        >
          Shortcut
        </motion.div>
      )}
    </motion.form>
  );
};

export default SearchBar;
