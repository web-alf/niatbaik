// Temporary placeholder used while pages are ported (Task 6). Each real page
// replaces its stub import in router.tsx.
export function Stub({ name }: { name: string }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-mute text-sm">
      <div className="text-center">
        <div className="font-bold text-ink">{name}</div>
        <div className="mt-1">Halaman ini sedang diport ke React Router + TS.</div>
      </div>
    </div>
  );
}
