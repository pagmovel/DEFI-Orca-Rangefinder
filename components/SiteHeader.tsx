import Link from "next/link";

export function SiteHeader({ backHref }: { backHref?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-mono text-[15px] font-semibold tracking-[0.16em] text-ink">
            RANGE
            <span className="text-aqua">·</span>
            FINDER
          </span>
          <span className="hidden font-mono text-[10px] tracking-[0.2em] text-ink-faint sm:inline">
            ORCA / SOLANA
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {backHref ? (
            <Link
              href={backHref}
              className="font-mono text-[11px] tracking-[0.12em] text-ink-dim transition-colors hover:text-aqua"
            >
              ← VOLTAR
            </Link>
          ) : (
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-ink-faint">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua" />
              DADOS AO VIVO · API ORCA
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
