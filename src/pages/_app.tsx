import { FC } from "react";
import Head from "next/head";
import { AppProps } from "next/app";
import styled from "@emotion/styled";

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
      <meta name="description" content="The website of Dennis Hedegaard" />
      <meta property="og:title" content="Dennis Hedegaard" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://www.dhedegaard.dk/" />
      <link rel="canonical" href="https://www.dhedegaard.dk/" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <meta name="theme-color" content="#fff" />
    </Head>
    <Container>
      <Component {...pageProps} />
    </Container>
  </>
);

export default Layout;

const Container = styled.div`
  width: 100%;
  box-sizing: border-box;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  padding-left: 24px;
  padding-right: 24px;
`;
