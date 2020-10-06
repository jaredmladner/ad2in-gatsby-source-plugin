const {
    ProductNode,
    ProductVariantNode,
    ProductVariantMetafieldNode } = require("./nodes");
const fetch = require("node-fetch")
const { forEach } = require("p-iteration")

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
const POST_NODE_TYPE = `ShopifyProduct`

const createNodes = async (
    entities,
    nodeFactory,
    { createNode, verbose, imageArgs },
    f = async () => { }
) => {
    await forEach(
        entities,
        async entity => {
            const node = await nodeFactory(imageArgs)(entity)
            createNode(node)
            await f(entity, node)
        }
    );
}

function renameKey(obj, oldKey, newKey) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
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

exports.onPreInit = () => console.log("Loaded gatsby-source-plugin-simong")

exports.sourceNodes = async function sourceNodes(
    {
        actions,
        createContentDigest,
        createNodeId,
        store,
        cache,
        getCache,
        reporter
    },
    pluginOptions,
    verbose = true
) {
    const { createNode, touchNode, deleteNode } = actions
    const helpers = Object.assign({}, actions, {
        createContentDigest,
        createNodeId,
    })
    // Arguments used for file node creation.
    const imageArgs = {
        createNode,
        createNodeId,
        touchNode,
        store,
        cache,
        getCache,
        reporter,
    }
    // Arguments used for node creation.
    const args = {
        createNode,
        createNodeId,
        verbose,
        imageArgs
    }

    // you can access plugin options here if need be
    console.log(`Space ID: ${pluginOptions.spaceId}`)

    const products = await getAllProducts();
    await forEach(products, product => {
        renameKey(product, 'name', 'title');
        renameKey(product, 'slug', 'handle');
        product.descriptionHtml = product.description;
        renameKey(product, 'images', 'imageUrls');
        product.priceRange = {
            minVariantPrice: { amount: "$0.00", currencyCode: "USD" },
            maxVariantPrice: { amount: "$0.00", currencyCode: "USD" },
        };
        forEach(product.variants, variant => {
            renameKey(variant, 'images', 'imageUrls')
            var currency = variant.price;
            var price = Number(currency.replace(/[^0-9.-]+/g,""));
            var maxPrice = Number(product.priceRange.maxVariantPrice.amount.replace(/[^0-9.-]+/g,""));
            var minPrice = Number(product.priceRange.minVariantPrice.amount.replace(/[^0-9.-]+/g,""));
            if (price >= maxPrice) 
                product.priceRange.maxVariantPrice.amount = variant.price;
            if (price <= minPrice || minPrice == 0) 
                product.priceRange.minVariantPrice.amount = variant.price;
        })
        product.images = [];
        for (let x = 0; x < product.imageUrls.length; x++) {
            let image = {
                altText: product.title,
                id: `${product.id}-image-${x}`,
                url: product.imageUrls[x]
            }
            product.images.push(image);
        }
    });

    try {
        let promises = []
        promises = promises.concat([
            createNodes(
                products,
                ProductNode,
                args,
                async (product, productNode) => {
                    if (product.variants)
                        await forEach(product.variants, async v => {
                            if (v.metafields)
                                await forEach(v.metafields, async metafield =>
                                    createNode(
                                        await ProductVariantMetafieldNode(imageArgs)(metafield)
                                    )
                                )
                            return createNode(
                                await ProductVariantNode(imageArgs, productNode)(v)
                            )
                        })

                    if (product.metafields)
                        await forEach(product.metafields, async metafield =>
                            createNode(await ProductMetafieldNode(imageArgs)(metafield))
                        )

                    if (product.options)
                        await forEach(product.options, async option =>
                            createNode(await ProductOptionNode(imageArgs)(option))
                        )
                }
            )
        ])
        await Promise.all(promises)
    } catch (e) {
        console.error(e)
    }
    return
}
