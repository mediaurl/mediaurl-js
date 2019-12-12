const Sdk = require("../../dist");
const { JSDOM } = require("jsdom");
const querystring = require("querystring");

const mediatypeAliases = {
    movies: "movie",
    collection: "catalog"
};

const fetchDOM = async url => {
    try {
        return JSDOM.fromURL(url);
    } catch (error) {
        if (error.response) {
            throw new Error(
                `${error.response.statusCode} ${error.response.statusMessage}`
            );
        }
        throw error;
    }
};

const handleItem = item => {
    const type = mediatypeAliases[item.getAttribute("data-mediatype")];
    if (!type) return undefined;
    const id = item.getAttribute("data-id");

    let name;
    if (type === "collection") {
        name = item.querySelector("div.collection-title a").textContent.trim();
    } else {
        name = item
            .querySelector("div.item-ttl a[title]")
            .getAttribute("title");
    }

    return {
        ids: { "archive.org": id },
        type,
        name,
        year: parseInt(item.getAttribute("data-year"), 10) || undefined,
        images: {
            poster: `https://archive.org/services/img/${id}`
        },
        director: [item.querySelector("span.byv") || {}.textContent].filter(
            x => x
        )
    };
};

const addon = Sdk.createWorkerAddon({
    type: "worker",
    id: "archive.org",
    version: "1.0.0",
    name: "Archive.org",
    homepage: "https://archive.org/",
    description: "Media provided by the internet archive.",
    flags: { adult: false },
    resources: [
        {
            actions: ["directory", "item"],
            itemTypes: ["movie"]
        }
    ]
});

addon.registerActionHandler(
    "directory",
    async (ctx, { id = "movies", page = 0, scroll = 1 }) => {
        const qs = querystring.stringify({
            sort: "-downloads",
            page,
            scroll,
            "and[]": `mediatype="movies"`
        });
        const url = `https://archive.org/details/${id}?${qs}`;
        console.log(`directory(${id}) ${url}`);
        const dom = await fetchDOM(url);
        try {
            const result = { hasMore: true };
            const { document } = dom.window;

            result.items = Array.from(document.querySelectorAll("div.item-ia"))
                .map(handleItem)
                .filter(item => item);

            return result;
        } finally {
            dom.window.close();
        }
    }
);

addon.registerActionHandler("item", async (ctx, { type, ids }) => {
    const id = ids["archive.org"];
    const url = `https://archive.org/details/${id}`;
    console.log(`item(${id}) ${url}`);
    const dom = await fetchDOM(url);
    try {
        const result = { type, ids };
        const { document } = dom.window;

        result.name = document
            .querySelector('[itemProp="name"]')
            .textContent.trim();
        result.description = document
            .querySelector('[itemProp="description"]')
            .textContent.trim();
        result.genres = Array.from(
            document.querySelectorAll('[itemProp="keywords"] a')
        )
            .map(e => e.textContent.trim())
            .filter(e => e);
        const thumbnail = document
            .querySelector('[itemProp="thumbnailUrl"]')
            .getAttribute("href");
        result.images = {
            poster: `https://archive.org/services/img/${id}`,
            backdrop: thumbnail
        };

        const url = document
            .querySelector('[itemProp="contentUrl"]')
            .getAttribute("href");
        result.sources = [
            {
                id,
                type: "url",
                url
            }
        ];

        return result;
    } finally {
        dom.window.close();
    }
});

module.exports = addon;
