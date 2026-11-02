import { describe, expect, it } from 'vitest'
import { EXPERIENCE, LOCATION } from '../about-me-data'

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

  it('gives the city and country only', () => {
    expect(LOCATION).toBe('Højbjerg, Denmark')
  })
})
