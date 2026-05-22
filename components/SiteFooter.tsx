export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
          DADOS: API ORCA · GECKOTERMINAL OHLCV
        </p>
        <p className="max-w-md text-[11px] leading-relaxed text-ink-faint">
          Ferramenta analítica. Estimativas de range baseadas em volatilidade
          histórica — não são recomendação de investimento.
        </p>
      </div>
    </footer>
  );
}
