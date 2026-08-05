/**
 * Znak Partnerskich Klubow Biznesu.
 *
 * UWAGA: to odwzorowanie z zrzutu ekranu portalu, nie plik oryginalny.
 * Przed oddaniem prezesowi trzeba podmienic na oficjalny SVG/PNG od klienta
 * i wgrac go do /public. Ksztalt i proporcje sa przyblizone, kolor zgodny.
 */
export function ZnakPKB({ className = 'size-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 40"
      className={className}
      fill="none"
      role="img"
      aria-label="Partnerskie Kluby Biznesu"
    >
      {/* podstawa */}
      <rect x="6" y="29" width="36" height="5" rx="1.4" fill="currentColor" />
      {/* ramie krotsze, w lewo */}
      <rect
        x="8.5"
        y="22.5"
        width="18"
        height="4.4"
        rx="1.2"
        fill="currentColor"
        transform="rotate(-9 8.5 22.5)"
      />
      {/* ramie dluzsze, w gore */}
      <rect
        x="24.4"
        y="27"
        width="24"
        height="4.4"
        rx="1.2"
        fill="currentColor"
        transform="rotate(-58 24.4 27)"
      />
    </svg>
  );
}

export function LogoPKB() {
  return (
    <div className="flex items-center gap-3">
      <ZnakPKB className="size-8 shrink-0 text-pkb-gold" />
      <span className="font-serif text-[13px] leading-[1.15] text-pkb-gold/90">
        Partnerskie
        <br />
        Kluby Biznesu
      </span>
    </div>
  );
}
