module.exports = {
  siteMetadata: {
    title: `Dennis Hedegaard`,
    description: `Personal website of a web developer from Aarhus`,
    author: `Dennis Hedegaard <dennis@dhedegaard.dk>`,
    siteUrl: `https://dhedegaard.dk`
  },
  plugins: [
    `gatsby-plugin-typescript`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-material-ui`,
    `gatsby-plugin-sitemap`,
    `gatsby-plugin-robots-txt`,
    `gatsby-plugin-remove-generator`,
    {
      resolve: `gatsby-plugin-prefetch-google-fonts`,
      options: {
        fonts: [
          {
            family: `Roboto`,
            subsets: [`latin`],
            variants: [`400`]
          }
        ]
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Dennis Hedegaard`,
        short_name: `Dennis Hedegaard`,
        icon: `src/images/favicon.png`,
        start_url: `/`,
        background_color: `#000`,
        theme_color: `#fff`,
        display: `standalone`
      }
    },
    `gatsby-plugin-offline`
  ]
};
