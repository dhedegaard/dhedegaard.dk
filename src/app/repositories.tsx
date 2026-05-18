import { Fragment } from 'react'
import { Link, Pin, Star } from 'lucide-react'
import { DataRepository } from '../fetchers/data-action'
import { Badge } from './badge'
import { GithubIcon } from '../icons/github'

interface RepositoriesProps {
  repositories: readonly DataRepository[]
}
export function Repositories({ repositories }: RepositoriesProps) {
  return (
    <div>
      <h2 className="mb-4 text-xl">Open source projects</h2>
      <div className="mb-9 grid w-full grid-flow-row grid-cols-2 gap-6 max-md:grid-cols-1">
        {repositories.map((repo) => (
          <Repo key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  )
}

interface RepoProps {
  repo: DataRepository
}
function Repo({ repo }: RepoProps) {
  return (
    <article className="flex flex-col gap-2 rounded-md border border-slate-300 p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <a
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
            <div className="flex items-center gap-1" aria-label="Stargazers">
              <span className="text-sm">{repo.stargazerCount}</span>
              <Star size={16} />
            </div>
          )}
          {repo.pinned && (
            <div aria-label="Pinned">
              <Pin size={16} />
            </div>
          )}
        </div>
      </div>

      <span className="line-clamp-3 flex-auto text-sm" title={repo.description ?? undefined}>
        {repo.description}
      </span>

      {repo.homepageUrl != null && (
        <a
          className="block truncate p-1 text-xs text-blue-600 no-underline"
          href={repo.homepageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Link size={11} className="inline-block" />
          &nbsp;
          {repo.homepageUrl.split('://')[1] ?? repo.homepageUrl}
        </a>
      )}

      {repo.topics.length > 0 && (
        <div className="inline-flex w-full flex-wrap gap-1">
          {repo.topics.map((topic) => (
            <Badge key={topic.id} label={topic.name} />
          ))}
        </div>
      )}

      {repo.languages.length > 0 && (
        <span className="text-xs">
          Language(s):&nbsp;
          <span className="inline text-xs font-bold">
            {repo.languages.map((language, index) => (
              <Fragment key={language.id}>
                {language.name}
                {index < repo.languages.length - 1 ? ', ' : null}
              </Fragment>
            ))}
          </span>
        </span>
      )}
    </article>
  )
}

