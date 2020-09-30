const { createRemoteFileNode } = require(`gatsby-source-filesystem`)
const fetch = require("node-fetch")

// JWT Token
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjNkOWM3ZDdiODQ5OTdmMWU0MjcyZjFhMTQ4YzZjZjE1ZjgwZTczNDMwYTgwNWRjM2RmMjNhOWYxNWNlNzk2OWM1ZDU1ZTQ1NDE4MGJjZGFmIn0.eyJhdWQiOiI0IiwianRpIjoiM2Q5YzdkN2I4NDk5N2YxZTQyNzJmMWExNDhjNmNmMTVmODBlNzM0MzBhODA1ZGMzZGYyM2E5ZjE1Y2U3OTY5YzVkNTVlNDU0MTgwYmNkYWYiLCJpYXQiOjE1OTc2NzIwNTIsIm5iZiI6MTU5NzY3MjA1MiwiZXhwIjoxNjI5MjA4MDUyLCJzdWIiOiIyNTkiLCJzY29wZXMiOltdfQ.xcIdcqtHhgHAtUZeOpEsjAaZRDHQHLn5u6UsNhpOsmM8FSlSIpLTIFZWA-ZKB2rYNKkG7GSIVqOLN75LtfxvZ_n9C_NYEOTrxesbAFVT7hmFCJ3kFyEimhkjDaH0z2oHr-YMzeOAAFa2zMowTfFmqIxsA5lMCLqQ_elCs8YLiGlhxxLN7Q2I3ou-P-EfQAXdxCri9UI7E_B9N-dh_darWp30dvbi_4rP04UY4Z0XAIYE501l94LYBGkGNA9OzIKlG0IAJUEawJMqgVomG_6wA-tVm5GUwagXta3MCOoBnb9wreCrnOZbxH-VlNxkUy9r_P-c8OfB50aFD1UX9Ny781WUNzib4SKtsaL3wp1waLAoIM74m2mhx5meTSt3wwJO46zhh5R2I35M-LA_W_FT6HYD2bMxaTbyrUf84ciSLRGDMW36mTQKYABRvZEtJ6bfUiNF4qJaWrl3JRbWL-pW97C7lUERvRNuFkdN7T1uTXYdnoaGkkeDSSFzTiQE1Ln_jE29muywkz4r3-SGqNKGVzO-tjwb1KLxLMBLGauRMhMgmjnVpIrA4xHWYhA5LVhMPGsmaqLLlqsniA4wxLSkNWgnz1Zbsv4-udL_3QEekfuTn9XoUg5IV7mgWsuQcKXdhYZZUd1RSrWYLqEGJMp3VyyQyKFC735uVFdbk71F9ks";
// need to add the JWT auth headers
const auth_headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
};
const options = {
    method: "Get",
    headers: auth_headers
};
const apiUrl = 'https://api.simongjewelry.com/products';
const itemsPerPage = 10;
const PRODUCT_NODE_TYPE = 'ShopifyProduct'

// helper function for creating nodes
const createNodeFromData = (item, nodeType, helpers) => {
    const nodeMetadata = {
        id: helpers.createNodeId(`${nodeType}-${item.id}`),
        parent: null, // this is used if nodes are derived from other nodes, a little different than a foreign key relationship, more fitting for a transformer plugin that is changing the node
        children: [],
        internal: {
            type: nodeType,
            content: JSON.stringify(item),
            contentDigest: helpers.createContentDigest(item),
        },
    }

    const node = Object.assign({}, item, nodeMetadata)
    //console.log(node)
    helpers.createNode(node)
    return node
}


exports.onPreInit = () => console.log("Loaded gatsby-source-plugin-simong")

exports.createSchemaCustomization = ({ actions }) => {
    const { createTypes } = actions
    createTypes(`
      type ShopifyProduct implements Node {
        id: ID!
        slug: String!
        images: [String!]!
        # create relationships between ShopifyProduct and File nodes for optimized images
        remoteImage: File @link
        
      }`)
}

exports.sourceNodes = async function sourceNodes(
    {
        actions,
        createContentDigest,
        createNodeId
    },
    pluginOptions
) {
    const { createNode, touchNode, deleteNode } = actions
    const helpers = Object.assign({}, actions, {
        createContentDigest,
        createNodeId,
    })

    // you can access plugin options here if need be
    console.log(`Space ID: ${pluginOptions.spaceId}`)

    const products = await getAllProducts();

    // loop through data returned from the api and create Gatsby nodes for them
    products.forEach(product =>
        createNodeFromData(product, PRODUCT_NODE_TYPE, helpers)
    )

    return
}

async function getAllProducts() {

    let urls = []

    const initialResponse = await getAllUrls([`${apiUrl}?display=${itemsPerPage}`]);
    console.log(`Total pages: ${initialResponse[0].meta.last_page}; Total Products: ${initialResponse[0].meta.total}`);

    for (let pageNum = 1; pageNum <= 8; pageNum++) {
        urls.push(`${apiUrl}?display=${itemsPerPage}&page=${pageNum}`);
    }

    const start = Date.now();
    const productsResponses = await getAllUrls(urls);
    const stop = Date.now();
    console.log(`API Calls took: ${(stop - start) / 1000} seconds`)

    console.log(`Received ${productsResponses.length} HTTP Responses.`);
    // 1. convert the API response to the new format and add to final array
    var products = productsResponses.map(response => response.data);
    products = [].concat.apply([], products);
    console.log(`Received ${products.length} products from AP`);

    return products;
}

async function getAllUrls(urls) {
    console.log(urls);

    try {
        var data = await Promise.all(
            urls.map(
                url =>
                    fetch(url, options).then(
                        (response) => response.json()
                    )));
        return (data)

    } catch (error) {
        console.log(error)

        throw (error)
    }
}

/**
 * ============================================================================
 * Transform remote file nodes
 * ============================================================================
 */

exports.onCreateNode = async ({
    actions: { createNode },
    getCache,
    createNodeId,
    node,
}) => {
    // transfrom remote file nodes using Gatsby sharp plugins
    // because onCreateNode is called for all nodes, verify that you are only running this code on nodes created by your plugin
    if (node.internal.type === PRODUCT_NODE_TYPE) {
        for (const img of node.images) {
            const fileNode = await createRemoteFileNode({
                // the url of the remote image to generate a node for
                url: img,
                getCache,
                createNode,
                createNodeId,
                parentNodeId: node.id,
            })
            if (fileNode) {
                // used to add a field `remoteImage` to the ShopifyProduct node from the File node in the schemaCustomization API
                node.remoteImage = fileNode.id
            }
        }
    }
}