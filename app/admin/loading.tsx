export default function AdminLoading() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-10 w-32 animate-pulse rounded bg-white/10" />
      </div>

      <div className="space-y-3">
        {/* Header row */}
        <div className="flex gap-4 rounded-t-lg bg-white/5 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 flex-1 animate-pulse rounded bg-white/10" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-t border-white/5 px-4 py-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-4 flex-1 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
