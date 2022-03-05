import { css, Global } from "@emotion/react";
import styled from "@emotion/styled";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faStar } from "@fortawesome/free-regular-svg-icons/faStar";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faMapPin } from "@fortawesome/free-solid-svg-icons/faMapPin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography, { TypographyProps } from "@mui/material/Typography";
import Box from "@mui/system/Box";
import { orderBy, uniqBy } from "lodash";
import { GetStaticProps } from "next";
import { FC, Fragment } from "react";
import { getGithubUser, GithubRepository } from "../clients/github";

interface Props {
  repositories: Array<GithubRepository>;
  avatarUrl: string | null;
  bio: string | null;
}

const Index: FC<Props> = ({ repositories, avatarUrl, bio }) => (
  <>
    <Keyframes />
    <Box display="flex" justifyContent="space-between" gap={2} mt={4} mb={8}>
      <Box flex="auto" display="flex" flexDirection="column" gap={3}>
        <Title>Dennis Hedegaard</Title>
        {bio != null && <Bio>{bio}</Bio>}
        <FindMe>
          Find me on{" "}
          <Link href="https://github.com/dhedegaard" underline="none">
            <FAIcon icon={faGithub} size="sm" />
            &nbsp;
            <span>Github</span>
          </Link>
          ,{" "}
          <Link
            href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/"
            underline="none"
          >
            <FAIcon icon={faLinkedin} />
            &nbsp;
            <span>LinkedIn</span>
          </Link>{" "}
          or send me a{" "}
          <Link href="mailto:dennis@dhedegaard.dk" underline="none">
            <FAIcon icon={faEnvelope} />
            &nbsp;
            <span>mail</span>
          </Link>
          .
        </FindMe>
      </Box>
      {avatarUrl != null && (
        <Avatar src={avatarUrl} alt="Me" crossOrigin="anonymous" />
      )}
    </Box>
    {repositories != null && repositories.length > 0 && (
      <Repositories>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Interresting Github projects
        </Typography>
        <RepositoriesBox>
          {repositories.map((repo) => (
            <Repo key={repo.id} repo={repo} />
          ))}
        </RepositoriesBox>
      </Repositories>
    )}
  </>
);

const Repo: FC<{ repo: GithubRepository }> = ({ repo }) => (
  <RepoPaper variant="outlined">
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <RepoLink
        color="inherit"
        underline="none"
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        variant="subtitle1"
        sx={{ display: "flex" }}
      >
        {repo.name}&nbsp;
        <FontAwesomeIcon width="16px" icon={faGithub} />
      </RepoLink>
      <Box display="flex" gap={1} alignItems="center">
        {repo.stargazerCount > 0 && (
          <Box display="flex" gap={0.5} alignItems="center" title="Stargazers">
            <Typography fontSize="14px">{repo.stargazerCount}</Typography>
            <FontAwesomeIcon width="16px" fixedWidth icon={faStar} />
          </Box>
        )}
        {repo.pinned && (
          <Box title="Pinned">
            <FontAwesomeIcon width="10px" fixedWidth icon={faMapPin} />
          </Box>
        )}
      </Box>
    </Box>

    <Typography fontSize="0.9em" sx={{ flex: "auto" }}>
      {repo.description}
    </Typography>

    {repo.homepageUrl != null && (
      <Box display="flex" gap={1} alignItems="center">
        <FontAwesomeIcon icon={faLink} fixedWidth width={11} />{" "}
        <HomepageLink
          variant="body2"
          href={repo.homepageUrl}
          target="_blank"
          underline="none"
          rel="noopener noreferrer"
        >
          {repo.homepageUrl.split("://")[1] ?? repo.homepageUrl}
        </HomepageLink>
      </Box>
    )}

    {repo.topics.length > 0 && (
      <Box display="inline-flex" flexWrap="wrap" gap="4px" width="100%">
        {repo.topics.map(({ topic }) => (
          <Chip
            variant="outlined"
            key={topic.id}
            size="small"
            label={topic.name}
          />
        ))}
      </Box>
    )}

    {repo.languages.length > 0 && (
      <Typography fontSize="small" component="span">
        Language(s):&nbsp;
        {repo.languages.map((language, index) => (
          <Fragment key={language.id}>
            <Typography fontWeight="bold" display="inline" fontSize="small">
              {language.name}
            </Typography>
            {index < repo.languages.length - 1 ? ", " : null}
          </Fragment>
        ))}
      </Typography>
    )}
  </RepoPaper>
);

const Keyframes: FC = () => (
  <Global
    styles={css`
      @keyframes slideInLeft {
        0% {
          transform: translateX(-20px);
          opacity: 0;
        }
        50% {
          transform: translateX(-20px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `}
  />
);

const Title = styled((props: TypographyProps) => (
  // @ts-expect-error
  <Typography component="h1" variant="h3" {...props} />
))`
  @keyframes slideTitle {
    0% {
      transform: translateY(-20px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  animation: 0.5s ease-out 0s 1 slideTitle;
`;

const Bio = styled((props: TypographyProps) => (
  // @ts-expect-error
  <Typography component="p" variant="subtitle1" {...props} />
))`
  @keyframes slideBio {
    0% {
      transform: translateX(-20px);
      opacity: 0;
    }
    50% {
      transform: translateX(-20px);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
  animation: 1s ease-out 0s 1 slideBio;
`;

const FindMe = styled((props: TypographyProps) => (
  // @ts-expect-error
  <Typography variant="subtitle1" component="p" {...props} />
))`
  @keyframes slideFindMe {
    0% {
      transform: translateX(20px);
      opacity: 0;
    }
    66% {
      transform: translateX(20px);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
  animation: 1.5s ease-out 0s 1 slideFindMe;
`;

const HomepageLink = styled(Link)`
  overflow-x: hidden;
  text-overflow: ellipsis;
`;
const Avatar = styled.img`
  @keyframes slideAvatar {
    0% {
      transform: translateY(-20px);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
  will-change: transform, opacity;
  animation: 1s ease-out 0s 1 slideAvatar;
  width: 90px;
  aspect-ratio: 1;
  object-fit: cover;
  flex: none;
  border-radius: 50%;
  align-self: flex-start;

  @media (max-width: 768px) {
    width: 60px;
  }
`;

const Repositories = styled.div`
  @keyframes slideRepositories {
    0% {
      opacity: 0;
    }
    75% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  animation: 2s ease-out 0s 1 slideRepositories;
`;

const FAIcon = styled(FontAwesomeIcon)`
  width: 16px;
`;

const RepoLink = styled(Link)`
  text-decoration: none;
  font-weight: bold;
`;

const RepositoriesBox = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 36px;
  justify-content: space-between;
`;

const RepoPaper = styled(Paper)`
  padding: 16px;
  flex: 0 0 calc(50% - 12px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  @media (max-width: 1023px) {
    flex-basis: 100%;
    width: 100%;
  }
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
        homepageUrl: repo.homepageUrl === "" ? null : repo.homepageUrl,
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
    },
    revalidate: 3600,
  };
};

export default Index;
