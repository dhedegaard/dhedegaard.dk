import { FC, Fragment, memo } from 'react'
import { DataRepository, DataRepositoryTopic } from '../fetchers/data-action'
import { GithubIcon } from '../icons/github'
import { LinkIcon } from '../icons/link'
import { MapPinIcon } from '../icons/map-pin'
import { StarIcon } from '../icons/star'

export const Repositories = memo(function Repositories({
  repositories,
}: {
  repositories: readonly DataRepository[]
}) {
  return (
    <div className="animate-slideRepositories">
      <div className="flex w-full items-center justify-between">
        <h2 className="mb-4 text-xl">Interresting Github projects</h2>
      </div>
      <div className="mb-9 grid w-full grid-flow-row grid-cols-2 gap-6 max-md:grid-cols-1">
        {repositories.map((repo) => (
          <Repo key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  )
})

const Repo: FC<{ repo: DataRepository }> = memo(function Repo({ repo }) {
  return (
    <article className="box-border flex flex-col gap-2 rounded border p-4">
      <div className="flex items-start justify-between">
        <a
          role="heading"
          aria-level={2}
          className="flex font-bold text-inherit no-underline"
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {repo.name}&nbsp;
          <GithubIcon className="w-4" />
        </a>
        <div className="flex items-center gap-2">
          {repo.stargazerCount > 0 && (
            <div className="flex items-center gap-1" title="Stargazers">
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
            className="text-ellipsis p-1 text-xs text-blue-600 no-underline"
            href={repo.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {repo.homepageUrl.split('://')[1] ?? repo.homepageUrl}
          </a>
        </div>
      )}

      {repo.topics.length > 0 && (
        <div className="inline-flex w-full flex-wrap gap-1">
          {repo.topics.map((topic) => (
            <Topic key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {repo.languages.length > 0 && (
        <span className="text-xs">
          Language(s):&nbsp;
          {repo.languages.map((language, index) => (
            <Fragment key={language.id}>
              <span className="inline text-xs font-bold">{language.name}</span>
              {index < repo.languages.length - 1 ? ', ' : null}
            </Fragment>
          ))}
        </span>
      )}
    </article>
  )
})

const Topic = memo(function Topic({ topic }: { topic: DataRepositoryTopic }) {
  return (
    <div className="select-none rounded-2xl border border-gray-400 p-1.5 px-2 text-xs">
      {topic.name}
    </div>
  )
})
