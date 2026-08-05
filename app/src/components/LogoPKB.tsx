import Image from 'next/image';

/** Oryginalne logo Partnerskich Klubow Biznesu (plik od klienta). */
export function LogoPKB({ szerokosc = 168 }: { szerokosc?: number }) {
  return (
    <Image
      src="/logo-pkb.png"
      alt="Partnerskie Kluby Biznesu"
      width={szerokosc}
      height={Math.round((szerokosc * 111) / 328)}
      priority
      className="h-auto w-auto"
      style={{ width: szerokosc }}
    />
  );
}
