import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FindMeElement } from '../find-me-element'

describe('FindMeElement', () => {
  it('renders GitHub, LinkedIn, and Email links when email is available', () => {
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

  it('renders GitHub and LinkedIn links without Email when email is null', () => {
    const markup = renderToStaticMarkup(
      createElement(FindMeElement, {
        githubUrl: 'https://github.com/dhedegaard',
        email: null,
      })
    )

    expect(markup).toContain('href="https://github.com/dhedegaard"')
    expect(markup).toContain('href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/"')
    expect(markup).not.toContain('mailto:')
    expect(markup).not.toContain('Email')
  })
})
