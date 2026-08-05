import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Asystent Prezesa PKB',
    short_name: 'Asystent PKB',
    description: 'Asystent AI Partnerskich Klubów Biznesu',
    start_url: '/',
    display: 'standalone',
    background_color: '#14100c',
    theme_color: '#14100c',
    lang: 'pl',
    icons: [
      { src: '/ikona-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/ikona-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
