'use client';

import { useEffect } from 'react';

/**
 * DesktopViewport Component
 * Forces desktop viewport width on mobile devices by setting the viewport meta tag.
 * This makes mobile browsers render the site as if viewing on a desktop screen (1200px width).
 */
export default function DesktopViewport() {
  useEffect(() => {
    // Set viewport meta tag to force desktop width (1200px)
    // This will make mobile browsers render the site in desktop mode
    const viewportContent = 'width=1200, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (viewportMeta) {
      viewportMeta.setAttribute('content', viewportContent);
    } else {
      // Create viewport meta tag if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = viewportContent;
      const head = document.getElementsByTagName('head')[0];
      if (head) {
        head.appendChild(meta);
      }
    }
  }, []);

  return null;
}

