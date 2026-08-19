export default function EventsLoading() {
  return (
    <section className="space-y-8">
      <div className="h-10 w-48 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-[300px] w-full animate-pulse rounded-lg bg-white/5" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-full animate-pulse rounded bg-white/10" />
            <div className="flex gap-4">
              <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
