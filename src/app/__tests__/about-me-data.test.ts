import { describe, expect, it } from 'vitest'
import { EDUCATION, EXPERIENCE, LOCATION, contactEmail } from '../about-me-data'

describe('about-me-data', () => {
  it('lists the companies newest first', () => {
    expect(EXPERIENCE.map((job) => job.companies.map((company) => company.name))).toEqual([
      ['Digisense A/S'],
      ['Webnuts'],
      ['BilligVVS.dk', 'Brdr. A&O'],
    ])
  })

  it('marks the first job as current', () => {
    expect(EXPERIENCE[0].period).toMatch(/Present$/)
  })

  it('places every school in Viby J', () => {
    expect(EDUCATION.map((entry) => entry.place)).toEqual(['Viby J', 'Viby J', 'Viby J'])
  })

  it('names the HTX school', () => {
    expect(EDUCATION[2].school).toBe('Aarhus Tech')
  })

  it('gives the city and country only', () => {
    expect(LOCATION).toBe('Højbjerg, Denmark')
  })

  it('falls back to the public email when GitHub has none', () => {
    expect(contactEmail(null)).toBe('dennis@dhedegaard.dk')
  })

  it('prefers the email GitHub returns', () => {
    expect(contactEmail('x@y.z')).toBe('x@y.z')
  })
})
