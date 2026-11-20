export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Chargement…</span>
      <div className="h-10 w-64 animate-pulse rounded-md bg-night-900" />
      <div className="h-64 animate-pulse rounded-lg bg-night-900" />
    </div>
  );
}
