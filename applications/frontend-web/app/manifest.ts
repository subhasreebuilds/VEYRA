import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veyra',
    short_name: 'Veyra',
    description: 'Your personal grooming & wellness companion.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F5F0',
    theme_color: '#F8F5F0',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // In the future, you can add 192x192 and 512x512 PNG icons here for the actual phone app icon:
      // {
      //   src: '/icon-192x192.png',
      //   sizes: '192x192',
      //   type: 'image/png',
      // },
      // {
      //   src: '/icon-512x512.png',
      //   sizes: '512x512',
      //   type: 'image/png',
      // },
    ],
  };
}
