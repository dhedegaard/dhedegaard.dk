import { describe, expect, it } from 'vitest'
import { JSON_LD } from '../json-ld'
import { SITE_DESCRIPTION } from '../site-meta'
import { STACK } from '../tech-stack'
import { PHONE_PATTERN } from './phone-pattern'

const person = JSON_LD['@graph'][0]

describe('JSON_LD', () => {
  it('names the current company', () => {
    expect(person.worksFor.name).toBe('Digisense A/S')
  })

  it('lists each school once, without the abbreviation in the name', () => {
    expect(person.alumniOf.map((school) => school.name)).toEqual([
      'Erhvervsakademi Aarhus',
      'Aarhus Tech',
    ])
    expect(person.alumniOf[0]).toHaveProperty('alternateName', 'EAAA')
  })

  it('gives the city and country only', () => {
    expect(Object.keys(person.address).sort()).toEqual(
      ['@type', 'addressCountry', 'addressLocality'].sort()
    )
  })

  it('contains no phone number', () => {
    expect(JSON.stringify(JSON_LD)).not.toMatch(PHONE_PATTERN)
  })

  it('derives knowsAbout from the tech stack', () => {
    expect(person.knowsAbout).toEqual(STACK.flatMap(({ items }) => items))
  })
})

describe('SITE_DESCRIPTION', () => {
  it('states experience as a start year, not a count', () => {
    expect(SITE_DESCRIPTION).toContain('since 2012')
    expect(SITE_DESCRIPTION).not.toMatch(/years/i)
  })
})
