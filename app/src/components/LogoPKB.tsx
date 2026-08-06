/**
 * Logo Partnerskich Klubow Biznesu.
 *
 * CELOWO zwykly <img>, a NIE next/image. Plik ma 13 KB, wiec optymalizator nic nie oszczedza,
 * a potrafi zaszkodzic: przy szerokosci zadania 384 px i wyzej oddawal PNG, ktorego Chrome
 * nie potrafil zdekodowac i logo znikalo z panelu. Zwykly plik jest tu szybszy i pewniejszy.
 */
export function LogoPKB({ szerokosc = 168 }: { szerokosc?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-pkb.png"
      alt="Partnerskie Kluby Biznesu"
      width={327}
      height={138}
      decoding="async"
      style={{ width: szerokosc, height: 'auto' }}
    />
  );
}
