import React from 'react';

import * as LucideIcons from 'lucide-react';

interface BookmarkIconProps {
  title: string;
  url: string;
  iconType?: 'favicon' | 'lucide' | 'custom';
  lucideIcon?: string;
  iconColor?: string;
  customIconUrl?: string;
  size?: number; // Total container size
  noBackground?: boolean;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  title,
  url,
  iconType = 'favicon',
  lucideIcon,
  iconColor = '#ffffff',
  customIconUrl,
  size = 48,
  noBackground = false,
}) => {
  let fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(title || 'B')}&background=random`;

  if (iconType === 'lucide' && lucideIcon) {
    const IconComponent = (LucideIcons as any)[lucideIcon];
    if (IconComponent) {
      return (
        <div style={{
          width: noBackground ? '100%' : `${size}px`,
          height: noBackground ? '100%' : `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: noBackground ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: noBackground ? '0' : `${Math.max(8, size / 4)}px`,
        }}>
          <IconComponent color={iconColor} size={size * 0.6} />
        </div>
      );
    }
  }

  if (iconType === 'custom' && customIconUrl) {
    return (
      <div style={{
        width: noBackground ? '100%' : `${size}px`,
        height: noBackground ? '100%' : `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: noBackground ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: noBackground ? '0' : `${Math.max(8, size / 4)}px`,
        padding: noBackground ? '0' : `${size * 0.15}px`,
      }}>
        <img
          src={customIconUrl}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
        />
      </div>
    );
  }

  // Default Favicon logic
  let faviconUrl = '';
  try {
    const urlStr = url || '';
    const fullUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const domain = new URL(fullUrl).hostname;
    faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch (e) {
    faviconUrl = fallbackUrl;
  }

  return (
    <div style={{
      width: noBackground ? '100%' : `${size}px`,
      height: noBackground ? '100%' : `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: noBackground ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
      borderRadius: noBackground ? '0' : `${Math.max(8, size / 4)}px`,
      padding: noBackground ? '0' : `${size * 0.2}px`,
    }}>
      <img
        src={faviconUrl}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackUrl;
        }}
      />
    </div>
  );
};

export default BookmarkIcon;
