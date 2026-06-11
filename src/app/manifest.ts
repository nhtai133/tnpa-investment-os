import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TNPA Investment OS',
    short_name: 'TNPA OS',
    description: 'Personal Family Office Operating System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0C0E',
    theme_color: '#818CF8',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
