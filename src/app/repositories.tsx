import { DataRepository } from '../fetchers/data-action'
import { GithubIcon } from '../icons/github'
import { LinkIcon, PinIcon, StarIcon } from '../icons/lucide'
import { Badge } from './badge'
import { formatHomepageUrl } from './format-homepage-url'

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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <a
            className="flex font-bold text-inherit no-underline hover:underline"
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {repo.name}&nbsp;
            <GithubIcon className="w-4" />
          </a>
          {repo.archived && <Badge label="Archived" />}
        </div>
        <div className="flex items-center gap-2">
          {repo.stargazerCount > 0 && (
            <div
              className="flex items-center gap-1"
              role="img"
              aria-label={`${String(repo.stargazerCount)} ${repo.stargazerCount === 1 ? 'stargazer' : 'stargazers'}`}
            >
              <span className="text-sm tabular-nums" aria-hidden="true">
                {repo.stargazerCount}
              </span>
              <StarIcon width={16} height={16} />
            </div>
          )}
          {repo.pinned && (
            <div role="img" aria-label="Pinned">
              <PinIcon width={16} height={16} />
            </div>
          )}
        </div>
      </div>

      <span className="line-clamp-3 flex-auto text-sm" title={repo.description ?? undefined}>
        {repo.description}
      </span>

      {repo.homepageUrl != null && (
        <a
          className="block min-w-0 truncate p-1 text-xs text-blue-600 no-underline hover:underline"
          href={repo.homepageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkIcon className="inline-block" width={11} height={11} />
          &nbsp;
          {formatHomepageUrl(repo.homepageUrl)}
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
          Languages:&nbsp;
          <span className="inline text-xs font-bold">
            {repo.languages.map((language) => language.name).join(', ')}
          </span>
        </span>
      )}
    </article>
  )
}
