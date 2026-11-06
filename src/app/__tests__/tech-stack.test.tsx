import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TechStack } from '../tech-stack'

describe('TechStack', () => {
  it('labels the section with a heading', () => {
    expect(renderToStaticMarkup(createElement(TechStack))).toMatch(/<h2[^>]*>Tech stack<\/h2>/)
  })

  it('keeps the badge text selectable', () => {
    expect(renderToStaticMarkup(createElement(TechStack))).not.toContain('select-none')
  })

  it('stays visible when printing', () => {
    const markup = renderToStaticMarkup(createElement(TechStack))

    expect(markup).not.toContain('print:hidden')
  })

  it('prints on one page', () => {
    expect(renderToStaticMarkup(createElement(TechStack))).toMatch(
      /^<div class="[^"]*\bprint:break-inside-avoid\b/
    )
  })

  it('prints the badge backgrounds', () => {
    const markup = renderToStaticMarkup(createElement(TechStack))

    const badges = markup.match(/<span class="rounded[^"]*"/g) ?? []

    expect(badges.length).toBeGreaterThan(0)
    for (const badge of badges) {
      expect(badge).toContain('[print-color-adjust:exact]')
      expect(badge).toContain('[-webkit-print-color-adjust:exact]')
    }
  })
})
