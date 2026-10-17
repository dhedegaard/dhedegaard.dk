import { createElement, createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { HeatmapWindow } from '../../fetchers/contribution-calendar'
import { HeatmapControls } from '../heatmap-controls'

const period = (start: string, days: number): HeatmapWindow => ({
  start,
  counts: Array.from({ length: days }, () => 0),
  thresholds: [],
  total: 0,
  activeDays: 0,
})

const windows = [period('2025-10-17', 365), period('2024-10-17', 365), period('2023-10-17', 366)]

const render = (selected: number, hydrated = true, list: readonly HeatmapWindow[] = windows) =>
  renderToStaticMarkup(
    createElement(HeatmapControls, {
      windows: list,
      selected,
      hydrated,
      olderRef: createRef<HTMLButtonElement>(),
      onOlder: () => undefined,
      onNewer: () => undefined,
      onLatest: () => undefined,
      onKeyDown: () => undefined,
    })
  )

const button = (markup: string, text: string): string =>
  markup.match(
    new RegExp(`<button[^>]*>(?:(?!</button>).)*${text}(?:(?!</button>).)*</button>`)
  )?.[0] ?? ''

describe('HeatmapControls', () => {
  it('names the buttons after the windows they open', () => {
    const markup = render(1)

    expect(button(markup, 'Older')).toContain('aria-label="Older: 17 Oct 2023 – 16 Oct 2024"')
    expect(button(markup, 'Newer')).toContain('aria-label="Newer: Past 12 months"')
    expect(button(markup, 'Latest')).toContain('aria-label="Latest: Past 12 months"')
    expect(button(markup, 'Latest')).not.toMatch(/class="[^"]*invisible/)
    expect(markup).toMatch(/role="status"[^>]*>17 Oct 2024 – 16 Oct 2025</)
    expect(markup).toContain('<span aria-hidden="true">‹</span>')
    expect(markup).toContain('<span aria-hidden="true">›</span>')
    expect(markup).toContain('<span aria-hidden="true">»</span>')
  })

  it('greys out the end buttons without a target name', () => {
    const latest = render(0)
    const newer = button(latest, 'Newer')
    expect(newer).toContain('aria-disabled="true"')
    expect(newer).not.toContain('aria-label')
    expect(button(latest, 'Latest')).toMatch(/class="[^"]*invisible/)
    expect(latest).toMatch(/role="status"[^>]*>Past 12 months</)

    const older = button(render(2), 'Older')
    expect(older).toContain('aria-disabled="true"')
    expect(older).not.toContain('aria-label')
  })

  it('groups the controls under one name', () => {
    expect(render(0)).toMatch(/^<div role="group" aria-label="Activity period"/)
  })

  it('hides the controls until hydrated', () => {
    expect(render(0, false)).toMatch(/^<div[^>]*class="[^"]*invisible/)
    expect(render(0, true)).not.toMatch(/^<div[^>]*class="[^"]*invisible/)
  })

  it('renders nothing for a single window', () => {
    expect(render(0, true, windows.slice(0, 1))).toBe('')
  })
})
