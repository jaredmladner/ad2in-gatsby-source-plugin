/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */
require('dotenv').config({ path: `.env` });

module.exports = {
  plugins: [
    // Simon G API Importer
    {
      resolve: `gatsby-source-plugin-simong`,
      options: {
        spaceId: "123",
        preview: true,
        apiUrl: 'https://api.simongjewelry.com/products',
        accessToken: process.env.GATSBY_SIMONG_ACCESS_TOKEN,
        cacheResponse: false,
      },
    },
    // Simon G API Importer
    // required to generate optimized images
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
  ],
}
