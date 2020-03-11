module.exports = [];
module.exports.push({
  addon: "watched-repo-example",
  action: "addon",
  input: {
    language: "de",
    region: "CH"
  },
  statusCode: 200,
  output: {
    id: "watched-repo-example",
    name: {
      cn: "示例存储库",
      de: "Beispiel Repository",
      en: "Example Repository",
      ru: "Пример репозитория"
    },
    version: "1.0.0",
    type: "repository"
  },
  i: 0
});
module.exports.push({
  addon: "watched-worker-example",
  action: "addon",
  input: {
    language: "de",
    region: "CH"
  },
  statusCode: 200,
  output: {
    actions: ["directory", "item", "source", "subtitle"],
    id: "watched-worker-example",
    name: "Typescript Example Addon",
    version: "1.0.0",
    itemTypes: ["movie"],
    type: "worker"
  },
  i: 1
});
module.exports.push({
  addon: "watched-repo-example",
  action: "repository",
  input: {
    language: "de",
    region: "CH"
  },
  statusCode: 200,
  output: [
    {
      actions: ["directory", "item", "source", "subtitle"],
      id: "watched-worker-example",
      name: "Typescript Example Addon",
      version: "1.0.0",
      itemTypes: ["movie"],
      type: "worker",
      metadata: {
        url: "./watched-worker-example"
      }
    }
  ],
  i: 2
});
module.exports.push({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "de",
    region: "CH",
    id: "",
    search: "",
    sort: "",
    filter: {},
    cursor: null,
    adult: false
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
        description: "This item does not have any sources."
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "id1235"
        },
        name: "Big Buck Bunny"
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "elephant"
        },
        name: "Elephants Dream",
        description: "Dream of elephants?"
      }
    ],
    nextCursor: null
  },
  i: 3
});
module.exports.push({
  addon: "watched-worker-example",
  action: "item",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1234",
      id: "id1234"
    },
    name: "Example Item 1",
    episode: {}
  },
  statusCode: 200,
  output: {
    type: "movie",
    ids: {
      "watched-worker-example": "id1234"
    },
    name: "Example Item 1",
    description: "This item does not have any sources."
  },
  i: 4
});
module.exports.push({
  addon: "watched-worker-example",
  action: "source",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1234",
      id: "id1234"
    },
    name: "Example Item 1",
    episode: {}
  },
  statusCode: 200,
  output: [],
  i: 5
});
module.exports.push({
  addon: "watched-worker-example",
  action: "item",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1235",
      id: "id1235"
    },
    name: "Big Buck Bunny",
    episode: {}
  },
  statusCode: 200,
  output: {
    type: "movie",
    ids: {
      "watched-worker-example": "id1235"
    },
    name: "Big Buck Bunny"
  },
  i: 6
});
module.exports.push({
  addon: "watched-worker-example",
  action: "source",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1235",
      id: "id1235"
    },
    name: "Big Buck Bunny",
    episode: {}
  },
  statusCode: 200,
  output: [
    {
      type: "url",
      id: "",
      name: "Source 1",
      url:
        "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4"
    }
  ],
  i: 7
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "id1235",
      id: "id1235"
    },
    name: "Big Buck Bunny",
    episode: {}
  },
  statusCode: 200,
  output: [],
  i: 8
});
module.exports.push({
  addon: "watched-worker-example",
  action: "item",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
    episode: {}
  },
  statusCode: 200,
  output: {
    type: "movie",
    ids: {
      "watched-worker-example": "elephant"
    },
    name: "Elephants Dream",
    description: "Dream of elephants?"
  },
  i: 9
});
module.exports.push({
  addon: "watched-worker-example",
  action: "source",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
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
  i: 10
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
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
  i: 11
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
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
  i: 12
});
module.exports.push({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "de",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "elephant",
      id: "elephant"
    },
    name: "Elephants Dream",
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
  i: 13
});
