/**
 * Public origin of the site, without a trailing slash. Override via the
 * `SITE_URL` env var (e.g. for preview deployments); defaults to production.
 */
export const SITE_URL = (process.env['SITE_URL'] ?? 'https://www.dhedegaard.dk').replace(/\/+$/, '')
