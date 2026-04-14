export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 px-4">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-[#0ca6b2] dark:border-white/15 dark:border-t-[#0ca6b2]"
        aria-hidden
      />
      <p className="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
    </div>
  );
}
