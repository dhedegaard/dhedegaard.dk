import styled from "@emotion/styled";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faStar } from "@fortawesome/free-regular-svg-icons/faStar";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faMapPin } from "@fortawesome/free-solid-svg-icons/faMapPin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { orderBy, uniqBy } from "lodash";
import type { GetStaticProps } from "next";
import Image, { ImageProps } from "next/image";
import { FC, Fragment } from "react";
import { getGithubUser, GithubRepository } from "../clients/github";

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
                <FontAwesomeIcon
                  icon={faGithub}
                  className="inline w-4"
                  size="sm"
                />
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
            <FontAwesomeIcon className="inline w-4" icon={faLinkedin} />
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
                <FontAwesomeIcon className="inline w-4" icon={faEnvelope} />
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
        <RepositoriesBox>
          {repositories.map((repo) => (
            <Repo key={repo.id} repo={repo} />
          ))}
        </RepositoriesBox>
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
        <FontAwesomeIcon width="16px" icon={faGithub} />
      </a>
      <div className="flex gap-2 items-center">
        {repo.stargazerCount > 0 && (
          <div className="flex gap-1 items-center" title="Stargazers">
            <span className="text-sm">{repo.stargazerCount}</span>
            <FontAwesomeIcon width="16px" fixedWidth icon={faStar} />
          </div>
        )}
        {repo.pinned && (
          <div title="Pinned">
            <FontAwesomeIcon width="10px" fixedWidth icon={faMapPin} />
          </div>
        )}
      </div>
    </div>

    <span className="flex-auto text-sm">{repo.description}</span>

    {repo.homepageUrl != null && (
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faLink} fixedWidth width={11} />{" "}
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
          <div
            key={topic.id}
            className="border border-gray-400 rounded-2xl text-xs p-1 px-2"
          >
            {topic.name}
          </div>
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

const RepositoriesBox = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 36px;
  justify-content: space-between;
`;

export const getStaticProps: GetStaticProps<Props> = async () => {
  const user = await getGithubUser().catch((error) => {
    console.error("Error fetching github user:", error);
    return undefined;
  });

  if (user == null) {
    return {
      props: {
        avatarUrl: null,
        bio: null,
        repositories: [],
        githubUrl: null,
        email: null,
      },
      revalidate: 5,
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
    props: {
      repositories: orderedRepos.slice(0, 40),
      avatarUrl: user?.avatarUrl ?? null,
      bio: user?.bio ?? null,
      githubUrl: user?.url ?? null,
      email: user?.email ?? null,
    },
    revalidate: 3600,
  };
};

export default Index;

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
