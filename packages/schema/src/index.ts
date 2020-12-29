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
      addon: {
        repository: createValidator(schemas, "out", "RepositoryAddon"),
        worker: createValidator(schemas, "out", "WorkerAddon"),
        iptv: createValidator(schemas, "out", "IptvAddon"),
        bundle: createValidator(schemas, "out", "BundleAddon"),
        all: createValidator(schemas, "out", "Addon"),
      },
      item: {
        directory: createValidator(schemas, "out", "DirectoryItem"),
        movie: createValidator(schemas, "out", "MovieItem"),
        series: createValidator(schemas, "out", "SeriesItem"),
        channel: createValidator(schemas, "out", "ChannelItem"),
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
      basic: {
        selftest: {
          request: createValidator(schemas, "in", "SelftestRequest"),
          response: createValidator(schemas, "out", "SelftestResponse"),
        },
        addon: {
          request: createValidator(schemas, "in", "AddonRequest"),
          originalResponse: createValidator(schemas, "out", "AddonResponse"),
          response: (obj: any) => {
            const fn =
              v.models.addon[obj?.type] ??
              v.actions.basic.addon.originalResponse;
            return fn(obj);
          },
        },
      },
      repository: {
        repository: {
          addonTypes: ["repository"],
          request: createValidator(schemas, "in", "RepositoryRequest"),
          originalResponse: createValidator(
            schemas,
            "out",
            "RepositoryResponse"
          ),
          response: (obj: any) => {
            if (!Array.isArray(obj)) {
              return v.actions.repository.repository.originalResponse(obj);
            }
            for (const o of obj) {
              const fn =
                v.models.addon[o.type] ??
                v.actions.addon.repository.originalResponse;
              fn(o);
            }
            return obj;
          },
        },
      },
      worker: {
        directory: {
          request: createValidator(schemas, "in", "DirectoryRequest"),
          originalResponse: createValidator(
            schemas,
            "out",
            "DirectoryResponse"
          ),
          response: (obj: any) => {
            const items = obj?.items;
            obj.items = Array.isArray(items) ? [] : items;
            v.actions.worker.directory.originalResponse(obj);
            for (const item of items) {
              const fn = v.models.item[item?.type] ?? v.models.item.all;
              fn(item);
            }
            obj.items = items;
            return obj;
          },
        },
        item: {
          request: createValidator(schemas, "in", "ItemRequest"),
          originalResponse: createValidator(schemas, "out", "ItemResponse"),
          response: (obj: any) => {
            const fn =
              v.models.item[obj?.type] ??
              v.actions.worker.item.originalResponse;
            return fn(obj);
          },
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
      },
      iptv: {
        iptv: {
          request: createValidator(schemas, "in", "IptvRequest"),
          response: createValidator(schemas, "out", "IptvResponse"),
        },
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
