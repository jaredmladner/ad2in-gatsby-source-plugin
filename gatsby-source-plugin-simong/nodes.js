const { map } = require('p-iteration')
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)
const createNodeHelpers = require(`gatsby-node-helpers`).default

const TYPE_PREFIX = `Shopify`
const PRODUCT = `Product`
const PRODUCT_VARIANT = `ProductVariant`

const { createNodeFactory, generateNodeId } = createNodeHelpers({
  typePrefix: TYPE_PREFIX,
})

const downloadImageAndCreateFileNode = async (
  { url, nodeId },
  { createNode, createNodeId, touchNode, store, cache, getCache, reporter }
) => {
  let fileNodeID

  const mediaDataCacheKey = `${TYPE_PREFIX}__Media__${url}`
  const cacheMediaData = await cache.get(mediaDataCacheKey)

  if (cacheMediaData) {
    fileNodeID = cacheMediaData.fileNodeID
    touchNode({ nodeId: fileNodeID })
    return fileNodeID
  }
  const fileNode = await createRemoteFileNode({
    url,
    store,
    cache,
    createNode,
    createNodeId,
    getCache,
    parentNodeId: nodeId,
    reporter,
  })

  if (fileNode) {
    fileNodeID = fileNode.id
    await cache.set(mediaDataCacheKey, { fileNodeID })
    return fileNodeID
  }

  return undefined
}

exports.CollectionNode = imageArgs =>
  createNodeFactory(COLLECTION, async node => {
    if (node.products) {
      node.products___NODE = node.products.edges.map(edge =>
        generateNodeId(PRODUCT, edge.node.id)
      )
      delete node.products
    }
    if (node.image)
      node.image.localFile___NODE = await downloadImageAndCreateFileNode(
        {
          id: node.image.id,
          url: node.image.src,
          nodeId: node.id,
        },
        imageArgs
      )
    return node
  })

exports.ProductNode = imageArgs =>
  createNodeFactory(PRODUCT, async node => {
    if (node.variants) {
      node.variants___NODE = node.variants.map(variant =>
        generateNodeId(PRODUCT_VARIANT, variant.id)
      )
      delete node.variants
    }

    if (node.images)
      node.images = await map(node.images, async image => {
        image.localFile___NODE = await downloadImageAndCreateFileNode(
          {
            id: image.id,
            url: image.url,
          },
          imageArgs
        )
        return image
      })
    return node
  })

exports.ProductVariantNode = (imageArgs, productNode) =>
  createNodeFactory(PRODUCT_VARIANT, async node => {
    if (node.metafields) {
      const metafields = node.metafields.edges.map(edge => edge.node)

      node.metafields___NODE = metafields.map(metafield =>
        generateNodeId(PRODUCT_VARIANT_METAFIELD, metafield.id)
      )
      delete node.metafields
    }

    // if (node.imageUrls) {
    //   node.images = [];
    //   Object.keys(node.imageUrls).forEach(key => {
    //     node.imageUrls[key].forEach(url => {
    //       let image = {
    //         id: node.id + key,
    //         url: url
    //       }
    //       image.localFile___NODE = downloadImageAndCreateFileNode(
    //         {
    //           id: image.id,
    //           url: image.url,
    //         },
    //         imageArgs
    //       );
    //       node.images.push(image);
    //     })
    //   });
    // }

    node.product___NODE = productNode.id
    return node
  })

exports.ProductVariantMetafieldNode = _imageArgs =>
  createNodeFactory(PRODUCT_VARIANT_METAFIELD)
