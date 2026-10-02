export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/90 bg-ink/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-brass/50 bg-brass/10 font-mono text-sm text-brass"
          >
            R
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-medium tracking-tight">Rifq</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-brass">OPS DESK</span>
            </div>
            <p className="truncate text-xs text-muted">
              Multi-agent console · Saba Technologies Ltd
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-brass">
            FIXTURE DATA
          </span>
          <span className="hidden font-mono text-[11px] tracking-[0.14em] text-faint sm:inline">
            DEMO
          </span>
        </div>
      </div>
    </header>
  );
}
