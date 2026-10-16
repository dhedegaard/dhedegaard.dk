export default function Loading() {
  return (
    <>
      <div className="mt-10 mb-12 flex gap-6">
        <div className="flex flex-auto flex-col gap-4">
          <div className="h-12 w-64 animate-pulse rounded bg-slate-800/10" />
          <div className="h-5 w-48 animate-pulse rounded bg-slate-800/10" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-full animate-pulse rounded bg-slate-800/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800/10" />
          </div>
          <div className="flex flex-col gap-2">
            {[80, 96, 72, 64, 112].map((w) => (
              <div key={w} className="flex gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-800/10" />
                <div className="h-4 animate-pulse rounded bg-slate-800/10" style={{ width: w }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 md:hidden">
            <div className="h-8 w-24 animate-pulse rounded bg-slate-800/10" />
            <div className="h-8 w-20 animate-pulse rounded bg-slate-800/10" />
            <div className="h-8 w-24 animate-pulse rounded bg-slate-800/10" />
          </div>
        </div>
        <div className="flex w-32 flex-none flex-col gap-3 self-start max-md:w-[60px]">
          <div className="aspect-square w-full animate-pulse rounded-full bg-slate-800/10" />
          <div className="flex flex-col gap-2 max-md:hidden">
            <div className="h-8 animate-pulse rounded bg-slate-800/10" />
            <div className="h-8 animate-pulse rounded bg-slate-800/10" />
            <div className="h-8 animate-pulse rounded bg-slate-800/10" />
          </div>
        </div>
      </div>
      <div className="mb-12">
        <div className="mb-4 h-7 w-32 animate-pulse rounded bg-slate-800/10" />
        <div className="h-3 w-full animate-pulse rounded-md bg-slate-800/10" />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {[104, 72, 64, 56, 92, 68, 76, 52, 84].map((w) => (
            <div
              key={w}
              className="h-5 animate-pulse rounded bg-slate-800/10"
              style={{ width: w }}
            />
          ))}
        </div>
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-800/10" />
      </div>
      <div className="mb-12">
        <div className="mb-4 h-7 w-24 animate-pulse rounded bg-slate-800/10" />
        <div className="h-30 w-full animate-pulse rounded-md bg-slate-800/10 md:h-32" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-800/10" />
      </div>
      <div className="mb-9 grid w-full grid-flow-row grid-cols-2 gap-6 max-md:grid-cols-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-md bg-slate-800/10" />
        ))}
      </div>
    </>
  )
}
