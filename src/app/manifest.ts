import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TNPA Wealth OS',
    short_name: 'TNPA Wealth',
    description: 'Personal Family Office Operating System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0C0E',
    theme_color: '#818CF8',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
