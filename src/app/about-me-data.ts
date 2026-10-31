interface CompanyLink {
  name: string
  url: string
}

interface Job {
  period: string
  role: string
  companies: readonly CompanyLink[]
  description: readonly string[]
  tech: readonly string[]
}

interface School {
  name: string
  abbreviation?: string
}

interface Degree {
  period: string
  degree: string
  school: School
  place: string
  summary: string
}

const FALLBACK_EMAIL = 'dennis@dhedegaard.dk'

export const CITY = 'Højbjerg'
export const LOCATION = `${CITY}, Denmark`

export const ABOUT = [
  "I've been into technology since I was seven or eight, and the curiosity grew into a career. Open source and spare-time experimenting keep me learning, and what I pick up feeds straight into my work.",
  "Working as a consultant brought me into contact with many kinds of people and businesses, and taught me that not every problem should be solved with technology. I enjoy solving problems in a clean, maintainable way that makes other people's work easier and faster.",
  "Collaboration and clear communication matter to me: I say what I think and often play devil's advocate, but once a decision is made I'm a team player.",
] as const satisfies readonly string[]

// Newest first; [0] is the current job.
export const EXPERIENCE = [
  {
    period: 'Apr 2022 – Present',
    role: 'Software Developer',
    companies: [{ name: 'Digisense A/S', url: 'https://www.digisense.dk/' }],
    description: [
      'Build systems that send and receive e-invoices, orders and credit notes between businesses across Denmark and Europe, over the Nemhandel and PEPPOL networks.',
      'Develop a portal that helps small businesses meet public-sector e-invoicing rules, with backup, document archiving and accounting-system integrations.',
      'Work in an agile team focused on quality: automated tests, CI/CD pipelines, and ownership of my work all the way into production.',
    ],
    tech: ['TypeScript', 'Zod', 'Next.js', 'Docker', 'Azure'],
  },
  {
    period: 'Sep 2018 – Mar 2022',
    role: 'Software Engineer',
    companies: [{ name: 'Webnuts', url: 'https://www.webnuts.com/' }],
    description: [
      'Built client systems as a consultant, and internal products, in a 6–7-person company where I had real influence on process and product.',
      'Worked directly with clients to understand their problems and shape the solutions.',
      'Kept quality high with code review and automated testing and deployment.',
    ],
    tech: ['Node.js', 'TypeScript', 'React', 'Next.js', 'PostgreSQL', 'Docker'],
  },
  {
    period: 'Jul 2012 – Aug 2018',
    role: 'Systems Developer',
    companies: [
      { name: 'BilligVVS.dk', url: 'https://www.billigvvs.dk/' },
      { name: 'Brdr. A&O', url: 'https://ao.dk/' },
    ],
    description: [
      'Developed webshops and back-office systems full-stack, integrated with warehouse, finance and ERP systems.',
      'Automated manual processes and rethought workflows in close collaboration with the people using the systems.',
      'Wrote stable, well-tested code with unit tests, Jenkins CI and Docker-based deployment.',
    ],
    tech: ['Python', 'Django', 'TypeScript', 'React', 'PostgreSQL', 'Redis', 'Linux', 'Docker'],
  },
] as const satisfies readonly Job[]

// Newest first.
export const EDUCATION = [
  {
    period: 'Jan 2011 – Jun 2012',
    degree: 'Professional Bachelor in Software Development (top-up)',
    school: { name: 'Erhvervsakademi Aarhus', abbreviation: 'EAAA' },
    place: 'Viby J',
    summary:
      'Systems integration, large-scale systems, testing, Android development and cloud computing.',
  },
  {
    period: 'Aug 2008 – Jan 2011',
    degree: 'AP Degree in Computer Science (Datamatiker)',
    school: { name: 'Erhvervsakademi Aarhus', abbreviation: 'EAAA' },
    place: 'Viby J',
    summary: 'Software design and development, networking and databases.',
  },
  {
    period: '2004 – 2007',
    degree: 'HTX (Higher Technical Examination)',
    school: { name: 'Aarhus Tech' },
    place: 'Viby J',
    summary: 'Upper secondary education focused on science, mathematics and technology.',
  },
] as const satisfies readonly Degree[]

export const SPOKEN_LANGUAGES = 'Danish (native) · English (fluent, daily use)'

export const OUTSIDE_WORK =
  'Fitness, running, walks, reading, computer games and tinkering with technology.'

// GitHub's public email can be null.
export const contactEmail = (email: string | null): string => email ?? FALLBACK_EMAIL
