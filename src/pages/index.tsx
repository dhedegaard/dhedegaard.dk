import styled from "@emotion/styled";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { faStar } from "@fortawesome/free-regular-svg-icons/faStar";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/system/Box";
import { GetStaticProps } from "next";
import { FC } from "react";
import {
  getLastUpdatedPublicRepositories,
  GithubRepository,
} from "../clients/github";

const FAIcon = styled(FontAwesomeIcon)`
  width: 16px;
  height: 16px;
`;

interface Props {
  repositories?: Array<GithubRepository>;
}

const Index: FC<Props> = ({ repositories }) => (
  <>
    <Typography variant="h4" component="h1" paragraph>
      Dennis Hedegaard
    </Typography>
    <Typography paragraph>
      A Software developer from Aarhus, Denmark. I work mostly with web
      technologies.
    </Typography>
    <Typography paragraph>
      Find me on{" "}
      <Link href="https://github.com/dhedegaard" underline="none">
        <FAIcon icon={faGithub} fixedWidth /> Github
      </Link>
      ,{" "}
      <Link
        href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/"
        underline="none"
      >
        <FAIcon icon={faLinkedin} fixedWidth /> LinkedIn
      </Link>{" "}
      or send me a{" "}
      <Link href="mailto:dennis@dhedegaard.dk" underline="none">
        <FAIcon icon={faEnvelope} fixedWidth /> mail
      </Link>
      .
    </Typography>
    {repositories != null && repositories.length > 0 && (
      <>
        <Divider sx={{ mt: 4, mb: 2 }} />
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Interresting Github repositories
          </Typography>
          {repositories.map((repo) => (
            <Repo key={repo.id} repo={repo} />
          ))}
        </Box>
      </>
    )}
  </>
);

const Repo: FC<{ repo: GithubRepository }> = ({ repo }) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ mb: 1 }}
    >
      <RepoLink
        color="inherit"
        underline="none"
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        variant="subtitle1"
      >
        {repo.name}
      </RepoLink>
      {repo.stargazers_count > 0 && (
        <Box display="flex">
          <Typography fontSize="small">{repo.stargazers_count}</Typography>
          &nbsp;
          <FontAwesomeIcon width={13} fixedWidth icon={faStar} />
        </Box>
      )}
    </Box>

    <Typography fontSize="0.9em" sx={{ mb: 1.5 }}>
      {repo.description}
    </Typography>

    {repo.homepage != null && repo.homepage !== "" && (
      <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
        <FontAwesomeIcon icon={faLink} fixedWidth width={11} />{" "}
        <Link
          variant="body2"
          href={repo.homepage}
          target="_blank"
          underline="none"
          rel="noopener noreferrer"
        >
          {repo.homepage}
        </Link>
      </Box>
    )}

    {repo.topics.length > 0 && (
      <Box
        display="inline-flex"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 1 }}
        width="100%"
      >
        {repo.topics.map((topic) => (
          <Chip variant="outlined" key={topic} size="small" label={topic} />
        ))}
      </Box>
    )}

    {repo.language != null && (
      <Typography fontSize="small">
        Language:&nbsp;
        <b>{repo.language}</b>
      </Typography>
    )}
  </Paper>
);

const RepoLink = styled(Link)`
  text-decoration: none;
  font-weight: bold;
`;

export const getStaticProps: GetStaticProps<Props> = async () => {
  const repositories = await getLastUpdatedPublicRepositories().catch(
    (error) => {
      console.error(error);
      return undefined;
    }
  );

  return {
    props: { repositories: repositories?.slice(0, 20) },
    revalidate: 3600,
  };
};

export default Index;
