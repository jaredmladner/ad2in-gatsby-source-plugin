import React from "react"
import { graphql } from "gatsby"
import Img from "gatsby-image"

export default ({ data }) => (
  <div
    style={{
      padding: 32,
    }}
  >
    <h1>Products</h1>
    <section
      style={{
        display: `grid`,
        gridTemplateColumns: `repeat( auto-fit, minmax(250px, 1fr) )`,
        gridGap: 16,
        justifyContent: "space-between",
      }}
    >
      {data.allShopifyProduct.nodes.map(product => (
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
          <h2>{product.slug}</h2>
          <p>{product.description}</p>
          <Img
            fluid={product.remoteImage.childImageSharp.fluid}
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
    allShopifyProduct {
      nodes {
        id
        slug
        description
        slug
        remoteImage {
          id
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
`
