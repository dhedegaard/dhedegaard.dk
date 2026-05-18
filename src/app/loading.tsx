export default function Loading() {
  return (
    <>
      <div className="mt-10 mb-12 flex gap-6">
        <div className="flex flex-auto flex-col gap-4">
          <div className="bg-slate-800/10 h-12 w-64 animate-pulse rounded" />
          <div className="bg-slate-800/10 h-5 w-48 animate-pulse rounded" />
          <div className="flex flex-col gap-2">
            <div className="bg-slate-800/10 h-4 w-full animate-pulse rounded" />
            <div className="bg-slate-800/10 h-4 w-3/4 animate-pulse rounded" />
          </div>
          <div className="flex flex-col gap-2">
            {[80, 96, 72, 64, 112].map((w) => (
              <div key={w} className="flex gap-2">
                <div className="bg-slate-800/10 h-4 w-20 animate-pulse rounded" />
                <div className="bg-slate-800/10 h-4 animate-pulse rounded" style={{ width: w }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 md:hidden">
            <div className="bg-slate-800/10 h-8 w-24 animate-pulse rounded" />
            <div className="bg-slate-800/10 h-8 w-20 animate-pulse rounded" />
            <div className="bg-slate-800/10 h-8 w-24 animate-pulse rounded" />
          </div>
        </div>
        <div className="flex w-32 max-md:w-[60px] flex-none flex-col gap-3 self-start">
          <div className="bg-slate-800/10 aspect-square w-full animate-pulse rounded-full" />
          <div className="flex flex-col gap-2 max-md:hidden">
            <div className="bg-slate-800/10 h-8 animate-pulse rounded" />
            <div className="bg-slate-800/10 h-8 animate-pulse rounded" />
            <div className="bg-slate-800/10 h-8 animate-pulse rounded" />
          </div>
        </div>
      </div>
      <div className="mb-9 grid w-full grid-flow-row grid-cols-2 gap-6 max-md:grid-cols-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-slate-800/10 h-36 animate-pulse rounded-md" />
        ))}
      </div>
    </>
  )
}
