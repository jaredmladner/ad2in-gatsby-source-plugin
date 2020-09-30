module.exports = ({ shopName, accessToken }) => ({
  plugins: [
    {
      resolve: `gatsby-source-plugin-simong`,
      options: {
        spaceId: "123",
        preview: true,
        cacheResponse: false,
      },
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-styled-components`,
  ],
});
