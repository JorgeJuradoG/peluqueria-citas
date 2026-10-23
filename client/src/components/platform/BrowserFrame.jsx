export default function BrowserFrame({ url, children, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-sand bg-surface shadow-xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-sand bg-sand/40 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-surface px-3 py-1 text-xs text-ink/60">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}