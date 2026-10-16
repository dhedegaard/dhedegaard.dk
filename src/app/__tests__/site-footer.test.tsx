import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SiteFooter } from '../site-footer'

const SHA = '2acdd4465546d212cd70cd06378cca8e2a8352fb'
const deployment = { sha: SHA, deployedAt: '2026-10-16T20:58:12.345Z' }
const cachedAt = new Date('2026-10-16T21:30:59Z')

const render = (props: Parameters<typeof SiteFooter>[0]) =>
  renderToStaticMarkup(createElement(SiteFooter, props))
const text = (markup: string) => markup.replace(/<[^>]+>/g, '')

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('SiteFooter', () => {
  it('shows when and from which commit the site was deployed', () => {
    const markup = render({ deployment, cachedAt })

    expect(text(markup)).toContain('Deployed 16 Oct 2026, 20:58 UTC from 2acdd44')
    expect(markup).toContain(`href="https://github.com/dhedegaard/dhedegaard.dk/commit/${SHA}"`)
  })

  it('shows when the cached data was generated', () => {
    expect(text(render({ deployment, cachedAt }))).toContain(
      'Data cached from 16 Oct 2026, 21:30 UTC'
    )
  })

  it('links to the source', () => {
    expect(render({ deployment, cachedAt })).toMatch(
      /<a [^>]*href="https:\/\/github\.com\/dhedegaard\/dhedegaard\.dk"[^>]*>Source<\/a>/
    )
  })

  it('opens its links in a new tab, like the rest of the site', () => {
    const links = render({ deployment, cachedAt }).match(/<a [^>]*>/g) ?? []

    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link).toContain('target="_blank"')
      expect(link).toContain('rel="noopener noreferrer"')
    }
  })

  it('leaves out the deployment without a commit', () => {
    const markup = text(render({ deployment: null, cachedAt }))

    expect(markup).not.toContain('Deployed')
    expect(markup).toMatch(/^Data cached from 16 Oct 2026, 21:30 UTC · Source$/)
  })

  it('pads the time to two digits', () => {
    expect(
      text(render({ deployment: null, cachedAt: new Date('2026-01-02T03:04:00Z') }))
    ).toContain('Data cached from 2 Jan 2026, 03:04 UTC')
  })

  it.each(['America/Los_Angeles', 'Pacific/Kiritimati'])('formats in UTC under TZ=%s', (tz) => {
    vi.stubEnv('TZ', tz)

    expect(text(render({ deployment, cachedAt }))).toContain(
      'Deployed 16 Oct 2026, 20:58 UTC from 2acdd44 · Data cached from 16 Oct 2026, 21:30 UTC'
    )
  })
})
