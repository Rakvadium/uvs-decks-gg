export function RouteChunkFallback() {
  return (
    <div className="flex h-full min-h-[40vh] w-full items-center justify-center p-6">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
