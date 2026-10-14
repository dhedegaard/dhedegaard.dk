import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TechStack } from '../tech-stack'

describe('TechStack', () => {
  it('labels the section with a heading', () => {
    expect(renderToStaticMarkup(createElement(TechStack))).toMatch(/<h2[^>]*>Tech stack<\/h2>/)
  })
})
