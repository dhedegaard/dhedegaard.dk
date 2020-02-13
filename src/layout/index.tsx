import React from "react";
import { CssBaseline, Container } from "@material-ui/core";
import { Helmet } from "react-helmet";
import favicon from "../images/favicon.png";

const Layout: React.FC = props => (
  <>
    <Helmet title="Dennis Hedegaard" defer={false}>
      <html lang="en" />
      <link rel="icon" href={favicon} />
      <meta name="description" content="The website of Dennis Hedegaard" />
      <meta property="og:title" content="Dennis Hedegaard" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://dhedegaard.dk/" />
      <link rel="canonical" href="https://dhedegaard.dk/" />
    </Helmet>
    <CssBaseline />
    <Container maxWidth="sm">{props.children}</Container>
  </>
);

export default Layout;
