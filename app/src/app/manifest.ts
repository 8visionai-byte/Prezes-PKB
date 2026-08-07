import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Asystent Prezesa PKB',
    // To wlasnie ten napis widac pod ikona na ekranie telefonu. Musi byc krotki,
    // bo dluzsze nazwy telefon i tak ucina wielokropkiem.
    short_name: 'Asystent',
    description: 'Asystent AI Partnerskich Klubów Biznesu',
    start_url: '/',
    display: 'standalone',
    background_color: '#14100c',
    theme_color: '#14100c',
    lang: 'pl',
    icons: [
      { src: '/ikona-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/ikona-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/ikona-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
