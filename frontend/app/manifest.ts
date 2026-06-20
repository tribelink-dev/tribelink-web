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
        src: '/triberoutes-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/triberoutes-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
