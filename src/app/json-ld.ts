import { SITE_URL } from '../site'
import { CITY, EDUCATION, EXPERIENCE } from './about-me-data'
import { LINKEDIN_URL } from './find-me-element'
import { GRAVATAR_AVATAR, JOB_TITLE, SITE_DESCRIPTION, SITE_NAME } from './site-meta'
import { STACK } from './tech-stack'

interface EducationalOrganization {
  '@type': 'EducationalOrganization'
  name: string
  alternateName?: string
}

// "Name (ABBR)" on the page becomes name + alternateName for search engines.
function educationalOrganization(school: string): EducationalOrganization {
  const { name, alternateName } =
    /^(?<name>.+) \((?<alternateName>[^)]+)\)$/.exec(school)?.groups ?? {}
  if (name !== undefined && alternateName !== undefined) {
    return {
      '@type': 'EducationalOrganization',
      name,
      alternateName,
    } satisfies EducationalOrganization
  }
  return { '@type': 'EducationalOrganization', name: school } satisfies EducationalOrganization
}

const currentCompany = EXPERIENCE[0].companies[0]

// Structured data for search engines: identifies the site's subject (Person)
// and the site itself (WebSite), linked via @id so the person is the author.
export const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: SITE_NAME,
      alternateName: 'Dennis Elsborg Heick Hedegaard',
      url: SITE_URL,
      image: GRAVATAR_AVATAR,
      jobTitle: JOB_TITLE,
      knowsAbout: STACK.flatMap(({ items }) => items),
      worksFor: { '@type': 'Organization', name: currentCompany.name, url: currentCompany.url },
      alumniOf: [...new Set(EDUCATION.map(({ school }) => school))].map(educationalOrganization),
      address: { '@type': 'PostalAddress', addressLocality: CITY, addressCountry: 'DK' },
      sameAs: ['https://github.com/dhedegaard', LINKEDIN_URL],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      author: { '@id': `${SITE_URL}/#person` },
    },
  ],
} as const
