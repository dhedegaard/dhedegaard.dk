import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FindMeElement } from '../find-me-element'

describe('FindMeElement', () => {
  it('renders GitHub, LinkedIn, and Email links', () => {
    const markup = renderToStaticMarkup(
      createElement(FindMeElement, {
        githubUrl: 'https://github.com/dhedegaard',
        email: 'dennis@example.com',
      })
    )

    expect(markup).toContain('href="https://github.com/dhedegaard"')
    expect(markup).toContain('href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/"')
    expect(markup).toContain('href="mailto:dennis@example.com"')
    expect(markup).toContain('GitHub')
    expect(markup).toContain('LinkedIn')
    expect(markup).toContain('Email')
  })

  it('marks the GitHub and LinkedIn profiles as rel="me"', () => {
    const markup = renderToStaticMarkup(
      createElement(FindMeElement, {
        githubUrl: 'https://github.com/dhedegaard',
        email: 'dennis@example.com',
      })
    )

    expect(markup.match(/rel="me noopener noreferrer"/g)).toHaveLength(2)
  })
  it('prints each link as its target next to the icon', () => {
    const markup = renderToStaticMarkup(
      createElement(FindMeElement, {
        githubUrl: 'https://github.com/dhedegaard',
        email: 'dennis@example.com',
      })
    )
    const printLabels = [
      ...markup.matchAll(/<span class="hidden print:inline">([^<]*)<\/span>/g),
    ].map(([, label]) => label)

    expect(printLabels).toEqual([
      'github.com/dhedegaard',
      'dennis@example.com',
      'linkedin.com/in/dennis-hedegaard-39a02a22',
    ])
    expect(markup.match(/<span class="print:hidden">/g)).toHaveLength(3)
    expect(markup.match(/<svg/g)).toHaveLength(3)
    expect(markup.match(/<a [^>]*print:text-blue-600/g)).toHaveLength(3)
  })
})
