import React from "react"
import { graphql } from "gatsby"
import Img from "gatsby-image"

export default ({ data }) => (
  <div
    style={{
      padding: 32,
    }}
  >
    <h1>SimonG Products</h1>
    <section
      style={{
        display: `grid`,
        gridTemplateColumns: `repeat( auto-fit, minmax(250px, 1fr) )`,
        gridGap: 16,
        justifyContent: "space-between",
      }}
    >
      {data.allSimonGProduct.nodes.map(product => (
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
          <h2>{product.title}</h2>
          <p>{product.description}</p>
          <Img
            fluid={product.images[0].localFile.childImageSharp.fluid}
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
    allSimonGProduct {
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
