import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../styles/globals.css', import.meta.url), 'utf8')

describe('globals.css', () => {
  it('prints on A4', () => {
    expect(css).toMatch(/@page\s*\{[^}]*size:\s*A4/)
  })

  it('keeps colours in print without "Print backgrounds"', () => {
    expect(css).toMatch(/@media print\s*\{\s*html\s*\{[^}]*\bprint-color-adjust:\s*exact/)
  })
})
