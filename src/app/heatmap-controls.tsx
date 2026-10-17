import type { KeyboardEventHandler, RefObject } from 'react'
import type { HeatmapWindow } from '../fetchers/contribution-calendar'
import { periodLabel } from './heatmap-layout'

const BUTTON_CLASS =
  'rounded-sm px-1.5 py-0.5 hover:bg-slate-800/5 aria-disabled:cursor-default aria-disabled:text-slate-800/30 aria-disabled:hover:bg-transparent'

interface HeatmapControlsProps {
  windows: readonly HeatmapWindow[]
  selected: number
  hydrated: boolean
  olderRef: RefObject<HTMLButtonElement | null>
  onOlder: () => void
  onNewer: () => void
  onLatest: () => void
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>
}
export function HeatmapControls({
  windows,
  selected,
  hydrated,
  olderRef,
  onOlder,
  onNewer,
  onLatest,
  onKeyDown,
}: HeatmapControlsProps) {
  const current = windows[selected]
  if (windows.length < 2 || current == null) {
    return null
  }
  const older = windows[selected + 1]
  const newer = windows[selected - 1]

  return (
    // Invisible until hydrated, but keeps its space so nothing moves when it appears.
    <div
      role="group"
      aria-label="Activity period"
      className={`flex items-center gap-1 text-sm text-slate-800/80 ${hydrated ? '' : 'invisible'}`}
    >
      <span role="status" className="mr-1 text-slate-800/60">
        {periodLabel(current, selected === 0)}
      </span>
      <button
        ref={olderRef}
        type="button"
        className={BUTTON_CLASS}
        aria-disabled={older == null ? true : undefined}
        aria-label={older == null ? undefined : `Older: ${periodLabel(older, false)}`}
        onClick={onOlder}
        onKeyDown={onKeyDown}
      >
        <span aria-hidden="true">‹</span> Older
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-disabled={newer == null ? true : undefined}
        aria-label={newer == null ? undefined : `Newer: ${periodLabel(newer, selected - 1 === 0)}`}
        onClick={onNewer}
        onKeyDown={onKeyDown}
      >
        Newer <span aria-hidden="true">›</span>
      </button>
      {/* Keeps its slot on the latest window, so Older and Newer never move. */}
      <button
        type="button"
        className={`${BUTTON_CLASS} ${selected === 0 ? 'invisible' : ''}`}
        aria-label="Latest: Past 12 months"
        onClick={onLatest}
        onKeyDown={onKeyDown}
      >
        Latest <span aria-hidden="true">»</span>
      </button>
    </div>
  )
}
