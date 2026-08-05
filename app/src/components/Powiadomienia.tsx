'use client';

import { useEffect, useState } from 'react';

/** Zamienia klucz z serwera na format wymagany przez przegladarke. */
function doTablicy(base64: string) {
  const uzupelnienie = '='.repeat((4 - (base64.length % 4)) % 4);
  const czysty = (base64 + uzupelnienie).replace(/-/g, '+').replace(/_/g, '/');
  const surowe = atob(czysty);
  return Uint8Array.from([...surowe].map((z) => z.charCodeAt(0)));
}

type Stan = 'sprawdzam' | 'niedostepne' | 'wylaczone' | 'wlaczone' | 'odmowa';

export function Powiadomienia() {
  const [stan, setStan] = useState<Stan>('sprawdzam');
  const [pracuje, setPracuje] = useState(false);

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStan('niedostepne');
        return;
      }
      try {
        const r = await fetch('/api/push');
        const d = await r.json();
        if (!d.dostepne) {
          setStan('niedostepne');
          return;
        }
        const rej = await navigator.serviceWorker.register('/sw.js');
        const sub = await rej.pushManager.getSubscription();
        if (Notification.permission === 'denied') setStan('odmowa');
        else setStan(sub ? 'wlaczone' : 'wylaczone');
      } catch {
        setStan('niedostepne');
      }
    })();
  }, []);

  async function wlacz() {
    setPracuje(true);
    try {
      const zgoda = await Notification.requestPermission();
      if (zgoda !== 'granted') {
        setStan('odmowa');
        return;
      }
      const { klucz } = await (await fetch('/api/push')).json();
      const rej = await navigator.serviceWorker.ready;
      const sub = await rej.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: doTablicy(klucz),
      });
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setStan('wlaczone');
    } catch {
      setStan('niedostepne');
    } finally {
      setPracuje(false);
    }
  }

  async function wylacz() {
    setPracuje(true);
    try {
      const rej = await navigator.serviceWorker.ready;
      const sub = await rej.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStan('wylaczone');
    } finally {
      setPracuje(false);
    }
  }

  if (stan === 'sprawdzam' || stan === 'niedostepne') return null;

  if (stan === 'odmowa') {
    return (
      <span className="shrink-0 text-[11.5px] text-pkb-faint" title="Powiadomienia zablokowane w ustawieniach przeglądarki">
        powiadomienia zablokowane
      </span>
    );
  }

  const wl = stan === 'wlaczone';
  return (
    <button
      onClick={() => void (wl ? wylacz() : wlacz())}
      disabled={pracuje}
      aria-pressed={wl}
      title={wl ? 'Wyłącz powiadomienia na tym urządzeniu' : 'Dostaniesz sygnał, gdy asystent skończy pracę'}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition ${
        wl
          ? 'border-pkb-copper/50 bg-pkb-copper/10 text-pkb-gold'
          : 'border-pkb-border text-pkb-muted hover:border-pkb-copper hover:text-pkb-gold'
      } disabled:opacity-50`}
    >
      <svg viewBox="0 0 24 24" className="size-[14px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {wl ? 'Powiadomienia wł.' : 'Powiadom mnie'}
    </button>
  );
}
