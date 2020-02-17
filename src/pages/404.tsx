import React from "react";
import { Link as GatsbyLink } from "gatsby";
import Layout from "../layout";
import { Typography, Link } from "@material-ui/core";

const NotFound: React.FC = () => (
  <Layout>
    <Typography variant="h4" component="h1" paragraph>
      404: Not found
    </Typography>
    <Typography paragraph>
      The page does not exist.{" "}
      <Link component={GatsbyLink} to="/">
        Go to the main page
      </Link>
      .
    </Typography>
  </Layout>
);

export default NotFound;
