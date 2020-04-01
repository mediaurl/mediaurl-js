module.exports = [];
module.exports.version = 1;

var currentId = 1;
function addRecord(record) {
  record.id = currentId++;
  module.exports.push(record);
}

// Record ID 1
addRecord({
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
    sdkVersion: "0.23.1"
  }
});

// Record ID 2
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
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
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
        year: 2012
      }
    ],
    nextCursor: null
  }
});

// Record ID 3
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
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
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
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
  }
});

// Record ID 4
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
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
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
        year: 2012
      }
    ],
    nextCursor: null
  }
});

// Record ID 5
addRecord({
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
  }
});

// Record ID 6
addRecord({
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
  output: []
});

// Record ID 7
addRecord({
  addon: "watched-worker-example",
  action: "item",
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
  output: {
    type: "movie",
    ids: {
      "watched-worker-example": "id1235"
    },
    name: "Big Buck Bunny",
    year: 2013
  }
});

// Record ID 8
addRecord({
  addon: "watched-worker-example",
  action: "source",
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
  output: [
    {
      type: "url",
      id: "",
      name: "Source 1",
      url:
        "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4"
    }
  ]
});

// Record ID 9
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
    id: "",
    adult: false,
    search: "",
    sort: "",
    cursor: null,
    filter: {},
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
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
        year: 2012
      }
    ],
    nextCursor: null
  }
});

// Record ID 10
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
    id: "by-year",
    sort: "year",
    adult: false,
    search: "",
    cursor: null,
    filter: {},
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
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
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
  }
});

// Record ID 11
addRecord({
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
  output: []
});

// Record ID 12
addRecord({
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
  }
});

// Record ID 13
addRecord({
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
  ]
});

// Record ID 14
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
    id: "",
    adult: false,
    search: "",
    sort: "",
    cursor: null,
    filter: {},
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
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
        year: 2012
      }
    ],
    nextCursor: null
  }
});

// Record ID 15
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
    id: "by-year",
    sort: "year",
    adult: false,
    search: "",
    cursor: null,
    filter: {},
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
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
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
  }
});

// Record ID 16
addRecord({
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
  ]
});

// Record ID 17
addRecord({
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
  ]
});

// Record ID 18
addRecord({
  addon: "watched-worker-example",
  action: "resolve",
  input: {
    language: "en",
    region: "CH",
    url:
      "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm"
  },
  statusCode: 200,
  output: {
    url:
      "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm?chain=1",
    resolveAgain: true
  }
});

// Record ID 19
addRecord({
  addon: "watched-worker-example",
  action: "resolve",
  input: {
    language: "en",
    region: "CH",
    url:
      "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm?chain=1"
  },
  statusCode: 200,
  output:
    "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm?chain=1"
});

// Record ID 20
addRecord({
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
  ]
});

// Record ID 21
addRecord({
  addon: "watched-worker-example",
  action: "item",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "4ktest",
      id: "4ktest"
    },
    name: "4k Test",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: {
    type: "movie",
    ids: {
      "watched-worker-example": "4ktest"
    },
    name: "4k Test",
    description: "Test video with 4k resolution",
    year: 2012
  }
});

// Record ID 22
addRecord({
  addon: "watched-worker-example",
  action: "source",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "4ktest",
      id: "4ktest"
    },
    name: "4k Test",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: [
    {
      type: "url",
      name: "hls",
      url:
        "https://bitmovin-a.akamaihd.net/content/playhouse-vr/m3u8s/105560.m3u8"
    }
  ]
});

// Record ID 23
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
    id: "",
    adult: false,
    search: "",
    sort: "",
    cursor: null,
    filter: {},
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
      },
      {
        type: "movie",
        ids: {
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
        year: 2012
      }
    ],
    nextCursor: null
  }
});

// Record ID 24
addRecord({
  addon: "watched-worker-example",
  action: "directory",
  input: {
    language: "en",
    region: "CH",
    rootId: "",
    id: "by-year",
    sort: "year",
    adult: false,
    search: "",
    cursor: null,
    filter: {},
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
          "watched-worker-example": "4ktest"
        },
        name: "4k Test",
        description: "Test video with 4k resolution",
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
  }
});

// Record ID 25
addRecord({
  addon: "watched-worker-example",
  action: "subtitle",
  input: {
    language: "en",
    region: "CH",
    type: "movie",
    ids: {
      "watched-worker-example": "4ktest",
      id: "4ktest"
    },
    name: "4k Test",
    year: 2012,
    episode: {}
  },
  statusCode: 200,
  output: []
});
