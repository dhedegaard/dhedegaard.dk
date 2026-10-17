'use client'

import { useRef, useSyncExternalStore, type KeyboardEvent } from 'react'
import * as z from 'zod/mini'
import type { HeatmapWindow } from '../fetchers/contribution-calendar'
import { guardEnterRepeat } from './enter-repeat'
import { HeatmapControls } from './heatmap-controls'
import { HeatmapGrid } from './heatmap-grid'
import { yearsParam } from './years-param'

// The URL is the state: click handlers notify these after history.replaceState.
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}
const getSearch = () => window.location.search
// Null on the server and during hydration: the static page always shows the latest window.
const getServerSearch = () => null

const selectedWindow = (search: string, maxYears: number): number => {
  const years = z.safeDecode(yearsParam(maxYears), new URLSearchParams(search).get('years') ?? '')
  return years.success ? years.data : 0
}

interface ContributionHeatmapProps {
  windows: readonly HeatmapWindow[] | null
}
export function ContributionHeatmap({ windows }: ContributionHeatmapProps) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch)
  const olderRef = useRef<HTMLButtonElement>(null)
  const enterPressedOn = useRef<EventTarget | null>(null)
  const [latest] = windows ?? []
  if (windows == null || latest == null) {
    return null
  }
  const oldest = windows.length - 1
  const selected = search == null ? 0 : selectedWindow(search, oldest)

  const go = (index: number) => {
    const params = new URLSearchParams(window.location.search)
    if (index === 0) {
      params.delete('years')
    } else {
      const years = z.safeEncode(yearsParam(oldest), index)
      if (!years.success) {
        return
      }
      params.set('years', years.data)
    }
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query === '' ? '' : `?${query}`}${window.location.hash}`
    )
    for (const listener of listeners) {
      listener()
    }
  }
  // Step from the URL, not the render, so fast repeated presses never skip a window.
  const current = () => selectedWindow(window.location.search, oldest)
  const onOlder = () => {
    const index = current()
    if (index < oldest) {
      go(index + 1)
    }
  }
  const onNewer = () => {
    const index = current()
    if (index > 0) {
      go(index - 1)
    }
  }
  const onLatest = () => {
    go(0)
    // Latest turns invisible, so keep keyboard focus on the controls.
    olderRef.current?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const guard = guardEnterRepeat(event, enterPressedOn.current)
    enterPressedOn.current = guard.pressedOn
    if (guard.block) {
      event.preventDefault()
    }
  }

  return (
    <section className="mb-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl">Activity</h2>
        <HeatmapControls
          windows={windows}
          selected={selected}
          hydrated={search != null}
          olderRef={olderRef}
          onOlder={onOlder}
          onNewer={onNewer}
          onLatest={onLatest}
          onKeyDown={onKeyDown}
        />
      </div>
      {/* The key remounts the scroller, so phones reopen it at the newest weeks. */}
      <HeatmapGrid key={selected} period={windows[selected] ?? latest} latest={selected === 0} />
    </section>
  )
}
