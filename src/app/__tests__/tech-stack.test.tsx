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
  it('stays visible when printing, after the contact links', () => {
    const markup = renderToStaticMarkup(createElement(TechStack))

    expect(markup).not.toContain('print:hidden')
    expect(markup).toMatch(/^<div class="[^"]*\bprint:order-last\b/)
  })

  it('prints on one page', () => {
    expect(renderToStaticMarkup(createElement(TechStack))).toMatch(
      /^<div class="[^"]*\bprint:break-inside-avoid\b/
    )
  })
})
