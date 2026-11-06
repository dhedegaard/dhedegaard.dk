import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { About, Education, Experience } from '../about-me-sections'
import { PHONE_PATTERN } from './phone-pattern'

const about = renderToStaticMarkup(createElement(About))
const experience = renderToStaticMarkup(createElement(Experience))
const education = renderToStaticMarkup(createElement(Education))

describe('About-me sections', () => {
  it.each([
    ['About', about],
    ['Experience', experience],
    ['Education', education],
  ])('renders the %s heading', (heading, markup) => {
    expect(markup).toMatch(new RegExp(`<h2[^>]*>${heading}</h2>`))
  })

  it.each([About, Experience, Education])('adds className to the %o section', (Section) => {
    expect(
      renderToStaticMarkup(createElement(Section, { className: 'hidden print:block' }))
    ).toMatch(/^<section class="mb-12 hidden print:block">/)
  })

  it('ends Education with spoken languages', () => {
    expect(education).toMatch(/<h3[^>]*>Spoken languages<\/h3>/)
  })

  it('links the company name without showing its domain', () => {
    expect(experience).toContain('href="https://www.digisense.dk/"')
    expect(experience).toContain('Digisense A/S')
    expect(experience.replace(/href="[^"]*"/g, '')).not.toContain('digisense.dk')
  })

  it('names the schools and where they are', () => {
    expect(education).toContain('Erhvervsakademi Aarhus (EAAA)')
    expect(education).toContain('Aarhus Tech')
    expect(education).toContain('HTX')
    expect(education).toContain('Viby J')
  })

  it('contains no phone number', () => {
    for (const markup of [about, experience, education]) {
      expect(markup).not.toMatch(PHONE_PATTERN)
    }
  })
})

describe('PHONE_PATTERN', () => {
  it.each([
    '12 34 56 78',
    '+45 12345678',
    '12345678',
    '12-34-56-78',
    '12.34.56.78',
    '1234 5678',
    '+45 1234 5678',
  ])('matches %s', (value) => {
    expect(value).toMatch(PHONE_PATTERN)
  })

  it('ignores long hex hashes', () => {
    expect('d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f').not.toMatch(
      PHONE_PATTERN
    )
  })

  it.each([
    ['Experience', experience],
    ['Education', education],
  ])('keeps each %s entry on one printed page', (_, markup) => {
    const articles = markup.match(/<article[^>]*>/g) ?? []

    expect(articles.length).toBeGreaterThan(0)
    for (const article of articles) expect(article).toContain('print:break-inside-avoid')
  })

  it.each([
    ['About', about, '<p>'],
    ['Experience', experience, '<article'],
    ['Education', education, '<article'],
  ])('prints the %s heading together with the first entry', (heading, markup, first) => {
    expect(markup).toContain(
      `<div class="print:break-inside-avoid"><h2 class="mb-4 text-xl print:break-after-avoid">${heading}</h2>${first}`
    )
  })

  it('prints the spoken languages heading with its line', () => {
    expect(education).toMatch(
      /<div class="[^"]*print:break-inside-avoid[^"]*"><h3[^>]*>Spoken languages<\/h3><p/
    )
  })

  it('prints company names as plain text', () => {
    expect(
      experience.match(/<a [^>]*>/g)?.every((link) => link.includes('print:no-underline'))
    ).toBe(true)
  })
})
