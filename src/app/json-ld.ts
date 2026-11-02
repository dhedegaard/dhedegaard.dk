import { SITE_URL } from '../site'
import { CITY, type Degree, EDUCATION, EXPERIENCE } from './about-me-data'
import { GRAVATAR_AVATAR, JOB_TITLE, LINKEDIN_URL, SITE_DESCRIPTION, SITE_NAME } from './site-meta'
import { STACK } from './tech-stack'

interface OrganizationLd {
  '@type': 'Organization'
  name: string
  url: string
}

interface EducationalOrganizationLd {
  '@type': 'EducationalOrganization'
  name: string
  alternateName?: string
}

interface PersonLd {
  '@type': 'Person'
  '@id': string
  name: string
  alternateName: string
  url: string
  image: string
  jobTitle: string
  knowsAbout: readonly string[]
  worksFor: OrganizationLd
  alumniOf: readonly EducationalOrganizationLd[]
  address: { '@type': 'PostalAddress'; addressLocality: string; addressCountry: string }
  sameAs: readonly string[]
}

interface WebSiteLd {
  '@type': 'WebSite'
  '@id': string
  url: string
  name: string
  description: string
  inLanguage: string
  author: { '@id': string }
}

const currentCompany = EXPERIENCE[0].companies[0]

// One entry per school; the abbreviation becomes alternateName.
const alumniOf = [...new Set<Degree['school']>(EDUCATION.map(({ school }) => school))].map(
  (school) =>
    ({
      '@type': 'EducationalOrganization',
      name: school.name,
      ...(school.abbreviation !== undefined && { alternateName: school.abbreviation }),
    }) satisfies EducationalOrganizationLd
)

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
      alumniOf,
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
} as const satisfies { '@context': string; '@graph': readonly [PersonLd, WebSiteLd] }
