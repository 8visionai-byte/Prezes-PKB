import Image from 'next/image';

/**
 * Oryginalne logo Partnerskich Klubow Biznesu (plik transparentny od klienta).
 * Plik zawiera juz napis "Partnerskie Kluby Biznesu", wiec nie dokladamy tekstu obok.
 */
export function LogoPKB({ szerokosc = 168 }: { szerokosc?: number }) {
  return (
    <Image
      src="/logo-pkb.png"
      alt="Partnerskie Kluby Biznesu"
      width={szerokosc}
      height={Math.round((szerokosc * 111) / 328)}
      priority
      style={{ width: szerokosc, height: 'auto' }}
    />
  );
}
