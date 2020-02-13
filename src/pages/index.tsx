import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Typography, Link } from "@material-ui/core";
import React from "react";
import Layout from "../layout";
import styled from "styled-components";

const StyledFontAwesomeIcon = styled(FontAwesomeIcon)`
  width: 1em;
  height: 16px;
`;

const Index: React.FC = () => (
  <Layout>
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
  </Layout>
);

export default Index;
