import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { FC } from "react";
import styled from "styled-components";

const StyledFontAwesomeIcon = styled(FontAwesomeIcon)`
  width: 1em;
  height: 16px;
`;

const Index: FC = () => (
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
      <Link href="https://github.com/dhedegaard">
        <StyledFontAwesomeIcon icon={faGithub} /> Github
      </Link>
      ,{" "}
      <Link href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/">
        <StyledFontAwesomeIcon icon={faLinkedin} /> LinkedIn
      </Link>{" "}
      or send me a{" "}
      <Link href="mailto:dennis@dhedegaard.dk">
        <StyledFontAwesomeIcon icon={faEnvelope} /> mail
      </Link>
      .
    </Typography>
  </>
);

export default Index;
