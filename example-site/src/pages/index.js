import React from "react"
import { graphql } from "gatsby"
import Img from "gatsby-image"

export default ({ data }) => (
  <div
    style={{
      padding: 32,
    }}
  >
<<<<<<< HEAD
    <h1>SimonG Products</h1>
=======
    <h1>Products</h1>
>>>>>>> 50ee638d25bfc8956e37a4483678201b7c866914
    <section
      style={{
        display: `grid`,
        gridTemplateColumns: `repeat( auto-fit, minmax(250px, 1fr) )`,
        gridGap: 16,
        justifyContent: "space-between",
      }}
    >
<<<<<<< HEAD
      {data.allSimonGProduct.nodes.map(product => (
=======
      {data.allShopifyProduct.nodes.map(product => (
>>>>>>> 50ee638d25bfc8956e37a4483678201b7c866914
        <div
          style={{
            display: `flex`,
            flexDirection: `column`,
            justifyContent: `space-between`,
            padding: 16,
            border: `1px solid #ccc`,
            borderRadius: 8,
          }}
        >
<<<<<<< HEAD
          <h2>{product.title}</h2>
          <p>{product.description}</p>
          <Img
            fluid={product.images[0].localFile.childImageSharp.fluid}
=======
          <h2>{product.slug}</h2>
          <p>{product.description}</p>
          <Img
            fluid={product.remoteImage.childImageSharp.fluid}
>>>>>>> 50ee638d25bfc8956e37a4483678201b7c866914
            alt={product.name}
            style={{
              maxHeight: 300,
            }}
          />
        </div>
      ))}
    </section>
  </div>
)

export const query = graphql`
  {
<<<<<<< HEAD
    allSimonGProduct {
=======
    allShopifyProduct {
>>>>>>> 50ee638d25bfc8956e37a4483678201b7c866914
      nodes {
        id
        title
        description
        images {
          id
          localFile {
            childImageSharp {
              id
              fluid {
                ...GatsbyImageSharpFluid
              }
            }
          }
        }
      }
    }
  }
`
