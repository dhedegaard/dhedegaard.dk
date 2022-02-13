import { config } from "@fortawesome/fontawesome-svg-core";
import Container from "@mui/material/Container";
import { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { FC } from "react";

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
    {process.env.NODE_ENV === "production" && (
      <Script id="sw">
        {`// Check that service workers are supported
          if ('serviceWorker' in navigator) {
            // Use the window load event to keep the page load performant
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }`}
      </Script>
    )}
  </>
);

export default Layout;
