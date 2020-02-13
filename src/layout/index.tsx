import React from "react";
import { CssBaseline, Container } from "@material-ui/core";
import { Helmet } from "react-helmet";
import favicon from "../images/favicon.png";

const Layout: React.FC = props => (
  <>
    <Helmet title="Dennis Hedegaard" defer={false}>
      <html lang="en" />
      <link rel="icon" href={favicon} />
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width"
      />
      <meta name="description" content="The website of Dennis Hedegaard" />
      <meta property="og:type" content="website" />
      <link rel="canonical" href="https://dhedegaard.dk/" />
    </Helmet>
    <CssBaseline />
    <Container maxWidth="sm">{props.children}</Container>
  </>
);

export default Layout;
