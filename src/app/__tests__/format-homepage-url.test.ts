import { captureException } from '@sentry/nextjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatHomepageUrl } from '../format-homepage-url'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

describe('formatHomepageUrl', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('strips the scheme from a bare origin', () => {
    expect(formatHomepageUrl('https://example.com')).toBe('example.com')
    expect(formatHomepageUrl('http://example.com')).toBe('example.com')
  })

  it('drops a bare "/" path', () => {
    expect(formatHomepageUrl('https://example.com/')).toBe('example.com')
  })

  it('preserves path, query, and hash', () => {
    expect(formatHomepageUrl('https://example.com/foo/bar')).toBe('example.com/foo/bar')
    expect(formatHomepageUrl('https://example.com/p?q=1#h')).toBe('example.com/p?q=1#h')
  })

  it('keeps a non-default port in the host', () => {
    expect(formatHomepageUrl('https://example.com:8080/x')).toBe('example.com:8080/x')
  })

  it('falls back to the original string and reports when the URL cannot be parsed', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(formatHomepageUrl('not a url')).toBe('not a url')
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledTimes(1)

    consoleError.mockRestore()
  })
})
