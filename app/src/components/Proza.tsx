'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renderuje odpowiedz agenta jako markdown.
 *
 * To jest poprawka bledu, przez ktory linki przychodzily jako goly tekst:
 * agent zwraca poprawny markdown, ale aplikacja wyswietlala go doslownie.
 * Linki otwieraja sie w nowej karcie, tabele przewijaja sie same.
 */
export function Proza({ tresc }: { tresc: string }) {
  return (
    <div className="pkb-proza">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="pkb-tabela">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {tresc}
      </ReactMarkdown>
    </div>
  );
}
