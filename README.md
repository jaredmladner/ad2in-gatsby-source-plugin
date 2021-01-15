# Install Pre Reqs
Install Gatsby CLI: https://www.gatsbyjs.com/docs/reference/gatsby-cli/
`npm install -g gatsby-cli`

## Install Dependencies
Install node modules for example site

```
cd example-site
npm install
```

Install node modules for the plugin

```
cd g/example-site/plugins/gatsby-source-plugin-simong
npm install
```

## Configure the Environment Variables
1. copy the `.env-sample` to `.env`
2. replace the values with your access tokens

***Ensure you use quotes around the JWT token***

## Run locally
From the directory `./example-site`: 
```
gatsby develop
```

Access the web site: http://localhost:8000/

Access the GraphQL: http://localhost:8000/___graphql
