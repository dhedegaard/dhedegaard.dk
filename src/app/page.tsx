import { orderBy, uniqBy } from "lodash";
import Image, { ImageProps } from "next/image";
import { FC, Fragment, memo, use, useMemo } from "react";
import { getGithubUser, GithubRepository } from "../clients/github";
import type { Topic } from "../codegen/types";
import { EnvelopeIcon } from "../icons/envelope";
import { GithubIcon } from "../icons/github";
import { LinkIcon } from "../icons/link";
import { LinkedInIcon } from "../icons/linkedin";
import { MapPinIcon } from "../icons/map-pin";
import { StarIcon } from "../icons/star";

interface Props {
  repositories: Array<GithubRepository>;
  avatarUrl: string | null;
  bio: string | null;
  githubUrl: string | null;
  email: string | null;
}

const Index: FC<Props> = ({
  repositories,
  avatarUrl,
  bio,
  githubUrl,
  email,
}) => (
  <>
    <div className="flex gap-4 mt-8 mb-16">
      <div className="flex flex-auto flex-col gap-6">
        <h1 className="text-5xl animate-slideTitle">Dennis Hedegaard</h1>
        {bio != null && <p className="animate-slideBio">{bio}</p>}

        <p className="animate-slideFindMe">
          Find me on{" "}
          {githubUrl != null && (
            <>
              <a className="decoration-none text-blue-600" href={githubUrl}>
                <GithubIcon className="fill-blue-600  inline" width={16} />
                &nbsp;
                <span>Github</span>
              </a>
              ,{" "}
            </>
          )}
          <a
            className="decoration-none text-blue-600"
            href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/"
          >
            <LinkedInIcon className="inline fill-blue-600" width={16} />
            &nbsp;
            <span>LinkedIn</span>
          </a>{" "}
          {email != null && (
            <>
              or send me a{" "}
              <a
                className="decoration-none text-blue-600"
                href={`mailto:${email}`}
              >
                <EnvelopeIcon className="inline w-4 fill-blue-600" width={16} />
                &nbsp;
                <span>mail</span>
              </a>
              .
            </>
          )}
        </p>
      </div>
      {avatarUrl != null && <Avatar src={avatarUrl} alt="Me" />}
    </div>
    {repositories != null && repositories.length > 0 && (
      <div className="animate-slideRepositories">
        <h2 className="text-xl mb-4">Interresting Github projects</h2>
        <div className="flex flex-row flex-wrap gap-6 mb-9 justify-between">
          {repositories.map((repo) => (
            <Repo key={repo.id} repo={repo} />
          ))}
        </div>
      </div>
    )}
  </>
);

const Repo: FC<{ repo: GithubRepository }> = ({ repo }) => (
  <div className="border rounded p-4 flex-auto basis-[1px] min-w-[350px] box-border flex flex-col gap-2 ">
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
      <div className="flex items-center gap-2">
        <LinkIcon width={11} />{" "}
        <a
          className="no-underline text-blue-600 overflow-ellipsis text-xs"
          href={repo.homepageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {repo.homepageUrl.split("://")[1] ?? repo.homepageUrl}
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
            {index < repo.languages.length - 1 ? ", " : null}
          </Fragment>
        ))}
      </span>
    )}
  </div>
);

const Avatar = (props: ImageProps) => (
  <div className="animate-slideAvatar self-start flex-none w-[90px] aspect-square max-md:w-[60px]">
    <Image
      className="object-cover rounded-[50%] border-separate"
      priority
      width={90}
      height={90}
      {...props}
      alt="Me"
    />
  </div>
);

const getStaticProps = async (): Promise<Props> => {
  const user = await getGithubUser().catch((error) => {
    console.error("Error fetching github user:", error);
    return undefined;
  });

  if (user == null) {
    return {
      avatarUrl: null,
      bio: null,
      repositories: [],
      githubUrl: null,
      email: null,
    };
  }

  const orderedPinnedNodeIds =
    user.pinnedItems?.nodes
      ?.map((e) => e?.id)
      .filter((e): e is NonNullable<typeof e> => e != null) ?? [];
  const repos =
    user.topRepositories?.edges?.reduce<GithubRepository[]>((acc, edge) => {
      const repo = edge?.node;
      if (
        repo == null ||
        repo.isPrivate ||
        repo.isArchived ||
        repo.owner.id !== user.id
      ) {
        return acc;
      }

      acc.push({
        id: repo.id,
        name: repo.name,
        url: repo.url,
        pinned: orderedPinnedNodeIds.includes(repo.id),
        description: repo.description ?? null,
        homepageUrl: ensureHomepageUrl(repo.homepageUrl),
        updatedAt: repo.updatedAt ?? null,
        pushedAt: repo.pushedAt ?? null,
        stargazerCount: repo.stargazerCount,
        languages: uniqBy(
          [
            repo.primaryLanguage,
            ...(repo.languages?.edges?.map((e) => e?.node) ?? []),
          ].filter((e): e is NonNullable<typeof e> => e != null),
          (e) => e.id
        ),
        topics:
          repo.repositoryTopics.edges
            ?.map((topic) => topic?.node ?? undefined)
            ?.filter((e): e is NonNullable<typeof e> => e != null) ?? [],
      });
      return acc;
    }, []) ?? [];
  const orderedRepos = orderBy(
    repos,
    [
      // Pinned repos ascending
      (e) => {
        const index = orderedPinnedNodeIds.indexOf(e.id);
        return index === -1 ? Infinity : index;
      },
      "stargazerCount",
      "pushedAt",
    ],
    ["asc", "desc", "desc"]
  );

  return {
    repositories: orderedRepos.slice(0, 40),
    avatarUrl: user?.avatarUrl ?? null,
    bio: user?.bio ?? null,
    githubUrl: user?.url ?? null,
    email: user?.email ?? null,
  };
};

export default function OuterIndex() {
  const props = use(useMemo(() => getStaticProps(), []));
  return <Index {...props} />;
}

const ensureHomepageUrl = (url: unknown): string | null => {
  if (typeof url !== "string" || url === "") {
    return null;
  }
  let result = url;
  if (!result.startsWith("http")) {
    result = `https://${result}`;
  }
  return result;
};

const Topic = memo(function Topic({ topic }: { topic: Topic }) {
  return (
    <div className="border border-gray-400 rounded-2xl text-xs p-1 px-2">
      {topic.name}
    </div>
  );
});
