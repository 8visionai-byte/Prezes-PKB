'use client';

const OBRAZ = /\.(png|jpe?g|webp)$/i;
const HTML = /\.html?$/i;

/**
 * Karta wytworu agenta w czacie: podglad na miejscu, otwarcie na pelnym ekranie, pobranie.
 * Prezes nie musi szukac pliku w panelu bocznym, widzi go od razu przy odpowiedzi.
 */
export function KartaPliku({ nazwa, otworz }: { nazwa: string; otworz: (n: string) => void }) {
  const url = `/api/pliki/podglad?nazwa=${encodeURIComponent(nazwa)}`;
  const obraz = OBRAZ.test(nazwa);
  const html = HTML.test(nazwa);

  return (
    <figure className="mt-3 overflow-hidden rounded-xl border border-pkb-border bg-pkb-surface/60">
      <button
        onClick={() => otworz(nazwa)}
        aria-label={`Otwórz ${nazwa} na pełnym ekranie`}
        className="block w-full text-left"
      >
        {obraz ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={nazwa} className="max-h-72 w-full bg-pkb-bg object-contain" />
        ) : html ? (
          <div className="pointer-events-none h-56 overflow-hidden bg-pkb-bg">
            <iframe src={url} title={nazwa} sandbox="" scrolling="no" className="h-[672px] w-[300%] origin-top-left scale-[0.333] border-0" />
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center bg-pkb-bg text-pkb-faint">
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
            </svg>
          </div>
        )}
      </button>
      <figcaption className="flex items-center gap-2 border-t border-pkb-border-soft px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-pkb-muted">{nazwa}</span>
        <button
          onClick={() => otworz(nazwa)}
          className="rounded-lg border border-pkb-border px-2 py-1 text-[11.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold"
        >
          Powiększ
        </button>
        <a
          href={url}
          download={nazwa}
          className="rounded-lg border border-pkb-border px-2 py-1 text-[11.5px] text-pkb-muted transition hover:border-pkb-copper hover:text-pkb-gold"
        >
          Pobierz
        </a>
      </figcaption>
    </figure>
  );
}
