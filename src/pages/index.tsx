import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { FC } from "react";

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
        <FontAwesomeIcon icon={faGithub} fixedWidth /> Github
      </Link>
      ,{" "}
      <Link href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/">
        <FontAwesomeIcon icon={faLinkedin} fixedWidth /> LinkedIn
      </Link>{" "}
      or send me a{" "}
      <Link href="mailto:dennis@dhedegaard.dk">
        <FontAwesomeIcon icon={faEnvelope} fixedWidth /> mail
      </Link>
      .
    </Typography>
  </>
);

export default Index;
