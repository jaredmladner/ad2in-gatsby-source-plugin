const {
    ProductNode,
    ProductVariantNode,
    ProductVariantMetafieldNode } = require("./nodes");
const fetch = require("node-fetch")
const { forEach } = require("p-iteration")

const itemsPerPage = 10;

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

async function getAllProducts(apiOptions) {

    let urls = []
    // initial call to determine how many requests will be needed; as opposed to serial calls
    const initialResponse = await getAllUrls([`${apiOptions.apiUrl}?display=${itemsPerPage}`], apiOptions.options);
    console.log(`Total pages: ${initialResponse[0].meta.last_page}; Total Products: ${initialResponse[0].meta.total}`);
    // determine the total number of pages
    for (let pageNum = 1; pageNum <= 8; pageNum++) {
        urls.push(`${apiOptions.apiUrl}?display=${itemsPerPage}&page=${pageNum}`);
    }

    const start = Date.now();
    // get all products in parallel to save time
    const productsResponses = await getAllUrls(urls, apiOptions.options);
    const stop = Date.now();
    console.log(`API Calls took: ${(stop - start) / 1000} seconds`)

    console.log(`Received ${productsResponses.length} HTTP Responses.`);
    // 1. convert the API response to the new format and add to final array
    var products = productsResponses.map(response => response.data);
    products = [].concat.apply([], products);
    console.log(`Received ${products.length} products from AP`);

    return products;
}

async function getAllUrls(urls, options) {
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
    const auth_headers = {
        'Authorization': 'Bearer ' + pluginOptions.accessToken,
        'Content-Type': 'application/json'
    };
    const apiOptions = {
        options:  {
            method: "Get",
            headers: auth_headers
        },
        apiUrl: pluginOptions.apiUrl
    }

    // you can access plugin options here if need be
    console.log(`Space ID: ${pluginOptions.spaceId}`)

    const products = await getAllProducts(apiOptions);
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
