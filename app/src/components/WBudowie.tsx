export function WBudowie({
  tytul,
  akcent,
  opis,
  punkty,
}: {
  tytul: string;
  akcent: string;
  opis: string;
  punkty: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7 lg:px-8">
      <header className="flex items-baseline gap-2.5">
        <h1 className="text-[26px] font-semibold tracking-tight">{tytul}</h1>
        <span className="font-serif text-[26px] italic text-pkb-gold">{akcent}</span>
      </header>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-pkb-muted">{opis}</p>

      <div className="mt-7 rounded-2xl border border-pkb-border-soft bg-pkb-surface/40 p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-pkb-faint">W przygotowaniu</p>
        <ul className="mt-4 flex flex-col gap-3">
          {punkty.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[14.5px] leading-relaxed">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-pkb-copper" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
