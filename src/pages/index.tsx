import styled from "@emotion/styled";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faStar } from "@fortawesome/free-regular-svg-icons/faStar";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faMapPin } from "@fortawesome/free-solid-svg-icons/faMapPin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/system/Box";
import { orderBy, uniqBy } from "lodash";
import { GetStaticProps } from "next";
import { FC } from "react";
import { getGithubUser, GithubRepository } from "../clients/github";

interface Props {
  repositories: Array<GithubRepository>;
  avatarUrl: string | null;
  bio: string | null;
}

const Index: FC<Props> = ({ repositories, avatarUrl, bio }) => (
  <>
    <Box display="flex" justifyContent="space-between" gap={1}>
      <Box flex="auto">
        <Typography variant="h4" component="h1" paragraph>
          Dennis Hedegaard
        </Typography>
        {bio != null && <Typography paragraph>{bio}</Typography>}
        <Typography paragraph>
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
        </Typography>
      </Box>
      {avatarUrl != null && (
        <Avatar src={avatarUrl} alt="Me" crossOrigin="anonymous" />
      )}
    </Box>
    {repositories != null && repositories.length > 0 && (
      <>
        <Divider sx={{ mt: 2, mb: 2 }} />
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Interresting Github projects
        </Typography>
        <RepositoriesBox>
          {repositories.map((repo) => (
            <Repo key={repo.id} repo={repo} />
          ))}
        </RepositoriesBox>
      </>
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
          <FontAwesomeIcon
            title="Pinned"
            width="10px"
            fixedWidth
            icon={faMapPin}
          />
        )}
      </Box>
    </Box>

    <Typography fontSize="0.9em" sx={{ flex: "auto" }}>
      {repo.description}
    </Typography>

    {repo.homepageUrl != null && (
      <Box display="flex" gap={1} alignItems="center">
        <FontAwesomeIcon icon={faLink} fixedWidth width={11} />{" "}
        <Link
          variant="body2"
          href={repo.homepageUrl}
          target="_blank"
          underline="none"
          rel="noopener noreferrer"
        >
          {repo.homepageUrl}
        </Link>
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
      <Typography fontSize="small">
        Language(s):&nbsp;
        {repo.languages.map((language, index) => (
          <>
            <Typography
              key={language.id}
              fontWeight="bold"
              display="inline"
              fontSize="small"
              color={language.color ?? undefined}
            >
              {language.name}
            </Typography>
            {index < repo.languages.length - 1 ? ", " : null}
          </>
        ))}
      </Typography>
    )}
  </RepoPaper>
);

const Avatar = styled.img`
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
        homepageUrl: repo.homepageUrl,
        updatedAt: repo.updatedAt ?? null,
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
      "updatedAt",
    ],
    ["asc", "desc", "desc"]
  );

  return {
    props: {
      repositories: orderedRepos.slice(0, 30),
      avatarUrl: user?.avatarUrl ?? null,
      bio: user?.bio ?? null,
    },
    revalidate: 3600,
  };
};

export default Index;
