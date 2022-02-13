import { FC } from "react";
import Container from "@mui/material/Container";
import Head from "next/head";
import { AppProps } from "next/app";

import { config } from "@fortawesome/fontawesome-svg-core";
// We don't need the styles, so we just ignore it and style the SVGs ourselves.
// import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

const Layout: FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <Head>
      <title>Dennis Hedegaard</title>
      <link rel="icon" href="/favicon.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta
        name="description"
        content="The personal website of Dennis Hedegaard"
      />
      <meta property="og:title" content="Dennis Hedegaard" />
      <meta property="og:site_name" content="Dennis Hedegaard" />
      <meta property="og:url" content="https://www.dhedegaard.dk/" />
      <meta
        property="og:description"
        content="The personal website of Dennis Hedegaard"
      />
      <meta property="og:type" content="website" />
      <link rel="canonical" href="https://www.dhedegaard.dk/" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <meta name="theme-color" content="#fff" />
    </Head>
    <Container maxWidth="md">
      <Component {...pageProps} />
    </Container>
  </>
);

export default Layout;
