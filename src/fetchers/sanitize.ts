import * as z from 'zod/mini'

const HTTP_SCHEME_RE = /^https?:\/\//i
// A non-http(s) URI scheme (mailto:, tel:, ftp:, javascript:, ...). The negative
// lookahead for a digit keeps a scheme-less "host:port" (e.g. example.com:8080)
// from being mistaken for a scheme, since a port number follows the colon there.
const NON_HTTP_SCHEME_RE = /^[a-z][a-z\d+.-]*:(?!\d)/i
const HomepageUrl = z.url()
// A repository homepage is a website: normalize to an http(s) URL, or return
// null so the caller renders no link rather than a broken or invalid one.
export const ensureHomepageUrl = (url: unknown): string | null => {
  if (typeof url !== 'string') {
    return null
  }
  const trimmed = url.trim()
  if (trimmed === '') {
    return null
  }

  let candidate: string
  if (HTTP_SCHEME_RE.test(trimmed)) {
    candidate = trimmed
  } else if (trimmed.startsWith('//')) {
    candidate = `https:${trimmed}`
  } else if (NON_HTTP_SCHEME_RE.test(trimmed)) {
    return null
  } else {
    candidate = `https://${trimmed}`
  }

  return HomepageUrl.safeParse(candidate).success ? candidate : null
}

export const ensureString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Expected ${fieldName} to be a non-empty string`)
  }
  return value
}

export const ensureNonEmptyNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// Shown when GitHub has no public email.
export const FALLBACK_EMAIL = 'dennis@dhedegaard.dk'
const Email = z.email()
export const ensureEmail = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }
  const result = Email.safeParse(value)
  return result.success ? result.data : null
}
