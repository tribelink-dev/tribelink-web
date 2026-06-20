import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Triberoutes',
    short_name: 'Triberoutes',
    description:
      'Kerala cultural homestays and local-guided traditional experiences. Live with a Keralite family.',
    start_url: '/explore',
    display: 'standalone',
    background_color: '#FEFDFB',
    theme_color: '#FEFDFB',
    icons: [
      {
        src: '/icons/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
