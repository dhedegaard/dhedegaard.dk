import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PrintStamp } from '../print-stamp'

const cachedAt = new Date('2026-10-22T10:00:00Z')
const render = (deployedAt: string | null) =>
  renderToStaticMarkup(
    createElement(PrintStamp, {
      deployment: deployedAt == null ? null : { sha: 'a'.repeat(40), deployedAt },
      cachedAt,
    })
  )

describe('PrintStamp', () => {
  it('dates the printout by the last deploy, in UTC', () => {
    expect(render('2026-09-30T23:30:00Z')).toMatch(/From [\w.-]+ · September 2026/)
  })

  it('falls back to when the page was generated', () => {
    expect(render(null)).toMatch(/From [\w.-]+ · October 2026/)
  })

  it('shows only in print', () => {
    expect(render(null)).toMatch(/^<p class="hidden [^"]*print:block/)
  })
})
