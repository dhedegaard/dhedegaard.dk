import { FC, Fragment, memo } from 'react'
import type { GithubRepository } from '../clients/github'
import type { Topic as TopicType } from '../codegen/types'
import { GithubIcon } from '../icons/github'
import { LinkIcon } from '../icons/link'
import { MapPinIcon } from '../icons/map-pin'
import { StarIcon } from '../icons/star'

export const Repositories = memo(function Repositories({
  repositories,
}: {
  repositories: readonly GithubRepository[]
}) {
  return (
    <div className="animate-slideRepositories">
      <div className="flex w-full justify-between items-center">
        <h2 className="text-xl mb-4">Interresting Github projects</h2>
      </div>
      <div className="grid grid-cols-2 grid-flow-row gap-6 mb-9 w-full max-md:grid-cols-1">
        {repositories.map((repo) => (
          <Repo key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  )
})

const Repo: FC<{ repo: GithubRepository }> = memo(function Repo({ repo }) {
  return (
    <div className="border rounded p-4 box-border flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <a
          className="text-inherit no-underline flex font-bold"
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {repo.name}&nbsp;
          <GithubIcon className="w-4" />
        </a>
        <div className="flex gap-2 items-center">
          {repo.stargazerCount > 0 && (
            <div className="flex gap-1 items-center" title="Stargazers">
              <span className="text-sm">{repo.stargazerCount}</span>
              <StarIcon width={16} />
            </div>
          )}
          {repo.pinned && (
            <div title="Pinned">
              <MapPinIcon width={10} />
            </div>
          )}
        </div>
      </div>

      <span className="flex-auto text-sm">{repo.description}</span>

      {repo.homepageUrl != null && (
        <div className="flex items-center gap-1">
          <LinkIcon width={11} />{' '}
          <a
            className="p-1 no-underline text-blue-600 overflow-ellipsis text-xs"
            href={repo.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {repo.homepageUrl.split('://')[1] ?? repo.homepageUrl}
          </a>
        </div>
      )}

      {repo.topics.length > 0 && (
        <div className="inline-flex flex-wrap gap-1 w-full">
          {repo.topics.map(({ topic }) => (
            <Topic key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {repo.languages.length > 0 && (
        <span className="text-xs">
          Language(s):&nbsp;
          {repo.languages.map((language, index) => (
            <Fragment key={language.id}>
              <span className="font-bold inline text-xs">{language.name}</span>
              {index < repo.languages.length - 1 ? ', ' : null}
            </Fragment>
          ))}
        </span>
      )}
    </div>
  )
})

const Topic = memo(function Topic({ topic }: { topic: TopicType }) {
  return (
    <div className="border rounded-2xl text-xs p-1.5 px-2 select-none border-gray-400">
      {topic.name}
    </div>
  )
})
