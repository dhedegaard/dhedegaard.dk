import { orderBy, uniqBy } from 'lodash'
import Image from 'next/image'
import { memo, use } from 'react'
import { GithubRepository, getGithubUser } from '../clients/github'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'
import { Repositories } from './Repositories'

export default function Index() {
  const data = use(getData())

  return (
    <>
      <div className="flex gap-4 mt-8 mb-16">
        <div className="flex flex-auto flex-col gap-6">
          <h1 className="text-5xl animate-slideTitle">Dennis Hedegaard</h1>
          {data.bio != null && <p className="animate-slideBio">{data.bio}</p>}

          <p className="animate-slideFindMe">
            Find me on{' '}
            {data.githubUrl != null && (
              <>
                <a className="decoration-none text-blue-600" href={data.githubUrl}>
                  <GithubIcon className="fill-blue-600  inline" width={16} />
                  &nbsp;
                  <span>Github</span>
                </a>
                ,{' '}
              </>
            )}
            <a
              className="decoration-none text-blue-600"
              href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/"
            >
              <LinkedInIcon className="inline fill-blue-600" width={16} />
              &nbsp;
              <span>LinkedIn</span>
            </a>{' '}
            {data.email != null && (
              <>
                or send me a{' '}
                <a className="decoration-none text-blue-600" href={`mailto:${data.email}`}>
                  <EnvelopeIcon className="inline w-4 fill-blue-600" width={16} />
                  &nbsp;
                  <span>mail</span>
                </a>
                .
              </>
            )}
          </p>
        </div>
        <Avatar />
      </div>
      <Repositories repositories={data.repositories} />
    </>
  )
}

const Avatar = memo(function Avatar() {
  return (
    <div className="animate-slideAvatar self-start flex-none w-[90px] aspect-square max-md:w-[60px]">
      <Image
        className="object-cover rounded-[50%] border-separate"
        priority
        width={90}
        height={90}
        src="https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=90"
        crossOrigin="anonymous"
        alt="Me"
      />
    </div>
  )
})

const getData = async () => {
  const user = await getGithubUser().catch((error) => {
    console.error('Error fetching github user:', error)
    return undefined
  })

  if (user == null) {
    return {
      avatarUrl: null,
      bio: null,
      repositories: [],
      githubUrl: null,
      email: null,
    }
  }

  const orderedPinnedNodeIds =
    user.pinnedItems?.nodes
      ?.map((e) => e?.id)
      .filter((e): e is NonNullable<typeof e> => e != null) ?? []
  const repos =
    user.topRepositories?.edges?.reduce<GithubRepository[]>((acc, edge) => {
      const repo = edge?.node
      if (repo == null || repo.isPrivate || repo.isArchived || repo.owner.id !== user.id) {
        return acc
      }

      acc.push({
        id: repo.id,
        name: repo.name,
        url: repo.url,
        pinned: orderedPinnedNodeIds.includes(repo.id),
        description: repo.description ?? null,
        homepageUrl: ensureHomepageUrl(repo.homepageUrl),
        updatedAt: repo.updatedAt,
        pushedAt: repo.pushedAt,
        stargazerCount: repo.stargazerCount,
        languages: uniqBy(
          [repo.primaryLanguage, ...(repo.languages?.edges?.map((e) => e?.node) ?? [])].filter(
            (e): e is NonNullable<typeof e> => e != null
          ),
          (e) => e.id
        ),
        topics:
          repo.repositoryTopics.edges
            ?.map((topic) => topic?.node ?? undefined)
            ?.filter((e): e is NonNullable<typeof e> => e != null) ?? [],
      })
      return acc
    }, []) ?? []
  const orderedRepos = orderBy(
    repos,
    [
      // Pinned repos ascending
      (e) => {
        const index = orderedPinnedNodeIds.indexOf(e.id)
        return index === -1 ? Infinity : index
      },
      'stargazerCount',
      'pushedAt',
    ],
    ['asc', 'desc', 'desc']
  )

  return {
    repositories: orderedRepos.slice(0, 40),
    avatarUrl: user?.avatarUrl,
    bio: user?.bio,
    githubUrl: user?.url,
    email: user?.email,
  }
}

const ensureHomepageUrl = (url: unknown): string | null => {
  if (typeof url !== 'string' || url === '') {
    return null
  }
  let result = url
  if (!result.startsWith('http')) {
    result = `https://${result}`
  }
  return result
}
