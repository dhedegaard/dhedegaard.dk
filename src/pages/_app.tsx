import { FC } from "react";
import Container from "@mui/material/Container";
import Head from "next/head";
import { AppProps } from "next/app";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

const Layout: FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <Head>
      <html lang="en" />
      <title>Dennis Hedegaard</title>
      <link rel="icon" href="/favicon.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="description" content="The website of Dennis Hedegaard" />
      <meta property="og:title" content="Dennis Hedegaard" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://dhedegaard.dk/" />
      <link rel="canonical" href="https://dhedegaard.dk/" />
    </Head>
    <Container maxWidth="sm">
      <Component {...pageProps} />
    </Container>
  </>
);

export default Layout;
