const sdkVersion = require("@watchedcom/sdk/package.json").version;
module.exports = [];
module.exports.push({
  addon: "watched-worker-example",
  action: "addon",
  input: {
    language: "en",
    region: "CH"
  },
  statusCode: 200,
  output: {
    actions: ["directory", "item", "source", "subtitle", "resolve"],
    id: "watched-worker-example",
    name: "Typescript Example Addon",
    version: "1.0.0",
    itemTypes: ["movie"],
    rootDirectories: [
      {
        features: {
          search: {
            enabled: true
          },
          sort: [
            {
              id: "name",
              name: "Name"
            },
            {
              id: "year",
              name: "Year"
            }
          ]
        }
      }
    ],
    dashboards: [
      {},
      {
        id: "by-year",
        name: "By year",
        args: {
          sort: "year"
        }
      }
    ],
    type: "worker",
    urlPatterns: [
      "https:\\/\\/thepaciellogroup.github.io\\/AT-browser-tests\\/video\\/ElephantsDream.webm"
    ],
    sdkVersion
  },
  i: 0
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "",
    search: "",
    sort: "",
    filter: {},
    cursor: null,
    adult: false,
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1235"
        },
        name: "Big Buck Bunny",
        year: 2013
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?",
        year: 2012
      }
    ],
    nextCursor: null
  },
  i: 1
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "by-year",
    search: "",
    sort: "year",
    filter: {},
    cursor: null,
    adult: false,
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?",
        year: 2012
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1235"
        },
        name: "Big Buck Bunny",
        year: 2013
      }
    ],
    nextCursor: null
  },
  i: 2
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "",
    adult: false,
    search: "",
    filter: {},
    cursor: null,
    sort: "name",
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1235"
        },
        name: "Big Buck Bunny",
        year: 2013
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?",
        year: 2012
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      }
    ],
    nextCursor: null
  },
  i: 3
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "by-year",
    sort: "year",
    adult: false,
    search: "",
    filter: {},
    cursor: null,
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?",
        year: 2012
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1235"
        },
        name: "Big Buck Bunny",
        year: 2013
      }
    ],
    nextCursor: null
  },
  i: 4
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "by-year",
    sort: "name",
    adult: false,
    search: "",
    filter: {},
    cursor: null,
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1235"
        },
        name: "Big Buck Bunny",
        year: 2013
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?",
        year: 2012
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      }
    ],
    nextCursor: null
  },
  i: 5
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "by-year",
    sort: "name",
    adult: false,
    filter: {},
    cursor: null,
    search: "E",
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?",
        year: 2012
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      }
    ],
    nextCursor: null
  },
  i: 6
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "by-year",
    sort: "name",
    adult: false,
    filter: {},
    cursor: null,
    search: "Ex",
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      }
    ],
    nextCursor: null
  },
  i: 7
});
module.exports.push({
  addon: "watched-worker-example",
  action: "item",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1234",
      id: "id1234"
    },
    name: "Example Item 1",
    year: 2011,
    episode: {}
  },
  statusCode: 200,
  output: {
    type: "movie",
    ids: {
      "watched-worker-example": "id1234"
    },
    name: "Example Item 1",
    description: "This item does not have any sources.",
    year: 2011
  },
  i: 8
});
module.exports.push({
  addon: "watched-worker-example",
  action: "source",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1234",
      id: "id1234"
    },
    name: "Example Item 1",
    year: 2011,
    episode: {}
  },
  statusCode: 200,
  output: [],
  i: 9
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    id: "by-year",
    sort: "name",
    adult: false,
    filter: {},
    cursor: null,
    search: "",
    page: 1
  },
  statusCode: 200,
  output: {
    items: [
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1235"
        },
        name: "Big Buck Bunny",
        year: 2013
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?",
        year: 2012
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1234"
        },
        name: "Example Item 1",
        description: "This item does not have any sources.",
        year: 2011
      }
    ],
    nextCursor: null
  },
  i: 10
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1235",
      id: "id1235"
    },
    name: "Big Buck Bunny",
    year: 2013,
    episode: {}
  },
  statusCode: 200,
  output: [],
  i: 11
});
module.exports.push({
  addon: "watched-worker-example",
  action: "item",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: {
    type: "movie",
    ids: {
      "watched-worker-example": "elephant"
    },
    name: "Elephants Dream",
    description: "Dream of elephants?",
    year: 2012
  },
  i: 12
});
module.exports.push({
  addon: "watched-worker-example",
  action: "source",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: [
    {
      type: "url",
      name: "mp4",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.mp4"
    },
    {
      type: "url",
      name: "webm",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm"
    }
  ],
  i: 13
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: [
    {
      id: "vtt",
      name: "VTT",
      language: "en",
      type: "vtt",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.vtt"
    },
    {
      id: "ttml",
      name: "TTML",
      language: "en",
      type: "ttml",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.ttml"
    }
  ],
  i: 14
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: [
    {
      id: "vtt",
      name: "VTT",
      language: "en",
      type: "vtt",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.vtt"
    },
    {
      id: "ttml",
      name: "TTML",
      language: "en",
      type: "ttml",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.ttml"
    }
  ],
  i: 15
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: [
    {
      id: "vtt",
      name: "VTT",
      language: "en",
      type: "vtt",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.vtt"
    },
    {
      id: "ttml",
      name: "TTML",
      language: "en",
      type: "ttml",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.ttml"
    }
  ],
  i: 16
});
