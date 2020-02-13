module.exports = {
  siteMetadata: {
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
    }
  ]
};
