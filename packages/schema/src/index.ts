import type { Options } from "ajv";
import { Schema } from "./helpers";

const schema = require("./schema");

function createValidator(schemas: any, type: string, definition: string) {
  const validate = schemas[type].get(definition);
  if (!validate) {
    throw new Error(`Schema ${type}/${definition} not found`);
  }
  const fn = (obj: any) => {
    if (!validate(obj)) {
      const error: any = new Error(
        `Validation of ${type}/${definition} object failed\n` +
          JSON.stringify(
            {
              errors: validate.errors,
              obj: obj ?? null,
            },
            null,
            2
          )
      );
      error.obj = obj;
      error.errors = validate.errors;
      throw error;
    }
    return obj;
  };
  fn.definition = definition;
  fn.schema = validate.schema;
  return fn;
}

function init(schemas: any) {
  const v: any = {
    models: {
      addon: createValidator(schemas, "out", "Addon"),
      server: createValidator(schemas, "out", "Server"),
      item: {
        directory: createValidator(schemas, "out", "DirectoryItem"),
        movie: createValidator(schemas, "out", "MovieItem"),
        series: createValidator(schemas, "out", "SeriesItem"),
        channel: createValidator(schemas, "out", "ChannelItem"),
        unknown: createValidator(schemas, "out", "UnknownItem"),
        iptv: createValidator(schemas, "out", "IptvItem"),
        all: createValidator(schemas, "out", "MainItem"),
      },
      subItem: {
        episode: createValidator(schemas, "out", "SeriesEpisodeItem"),
        all: createValidator(schemas, "out", "SubItem"),
      },
      source: createValidator(schemas, "out", "Source"),
      subtitle: createValidator(schemas, "out", "Subtitle"),
      error: createValidator(schemas, "out", "Error"),
      task: {
        request: createValidator(schemas, "out", "TaskRequest"),
        response: createValidator(schemas, "in", "TaskResponse"),
      },
    },
    actions: {
      selftest: {
        request: createValidator(schemas, "in", "SelftestRequest"),
        response: createValidator(schemas, "out", "SelftestResponse"),
      },
      addon: {
        request: createValidator(schemas, "in", "AddonRequest"),
        response: createValidator(schemas, "out", "AddonResponse"),
      },
      catalog: {
        request: createValidator(schemas, "in", "CatalogRequest"),
        response: createValidator(schemas, "out", "CatalogResponse"),
      },
      item: {
        request: createValidator(schemas, "in", "ItemRequest"),
        response: createValidator(schemas, "out", "ItemResponse"),
      },
      source: {
        request: createValidator(schemas, "in", "SourceRequest"),
        response: createValidator(schemas, "out", "SourceResponse"),
      },
      subtitle: {
        request: createValidator(schemas, "in", "SubtitleRequest"),
        response: createValidator(schemas, "out", "SubtitleResponse"),
      },
      resolve: {
        request: createValidator(schemas, "in", "ResolveRequest"),
        response: createValidator(schemas, "out", "ResolveResponse"),
      },
      captcha: {
        request: createValidator(schemas, "in", "CaptchaRequest"),
        response: createValidator(schemas, "out", "CaptchaResponse"),
      },
      iptv: {
        request: createValidator(schemas, "in", "IptvRequest"),
        response: createValidator(schemas, "out", "IptvResponse"),
      },
    },
  };

  ["resolveSource", "resolveSubtitle"].forEach((key) => {
    v.actions[key] = v.actions.resolve;
  });

  return v;
}

const defaultOptions: Options = {
  coerceTypes: true,
  allowUnionTypes: true,
};

const schemaWithDefaults = new Schema({
  schema,
  schemaOptions: {
    ...defaultOptions,
    useDefaults: "empty",
  },
});

const schemaWithoutDefaults = new Schema({
  schema,
  schemaOptions: {
    ...defaultOptions,
    useDefaults: false,
  },
});

const serverValidators = init({
  in: schemaWithDefaults,
  out: schemaWithoutDefaults,
});

const clientValidators = init({
  in: schemaWithoutDefaults,
  out: schemaWithDefaults,
});

export const getServerValidators = () => {
  return serverValidators;
};

export const getClientValidators = () => {
  return clientValidators;
};
