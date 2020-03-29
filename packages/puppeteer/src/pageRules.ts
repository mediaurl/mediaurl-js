import { ActionHandlerContext } from "@watchedcom/sdk";
import fetch from "node-fetch";
import { HttpMethod, Page, Request, RespondOptions } from "puppeteer-core";

export type RuleAction = "allow" | "proxy" | "deny";

export type ActionFn = (
  request: Request
) => PromiseLike<RuleAction | RespondOptions | undefined | null | void>;

export type Rule = {
  /**
   * Resource type where this rule should be triggered.
   * Default: `null`
   */
  resourceType: null | string;
  /**
   * HTTP method (GET, POST, ...)
   * Default: null (all)
   */
  method: null | HttpMethod;
  /**
   * Matching URL pattern. `RegExp` or, if `string`, it will match against
   * `url.includes(rule.url)`.
   * Default: `null`
   */
  url: null | string | RegExp | (string | RegExp)[];
  /**
   * Action that should be triggered on a match.
   * - `allow`: Load the request directly
   * - `proxy`: Try to proxy the request
   * - `deny`: Block the request
   *
   * Can be an async callback function which can have the following return types:
   * `undefined`: The `defaultAction` will be used.
   * `RuleAction`: One of the actions listed above.
   * `RespondOptions`: This object will be cached if `cache` is `true` and
   * will be returned to the browser.
   *
   * Default: `deny`
   */
  action: undefined | RuleAction | ActionFn;
  /**
   * Cache requests.
   * Default: `false`
   */
  cache: boolean;
  /**
   * Surpress all log messages. When not set, the default value from
   * 'options.silentByDefault' will be used.
   */
  silent: boolean | undefined;
};

const defaultRule: Rule = {
  resourceType: null,
  method: null,
  url: null,
  action: "deny",
  cache: false,
  silent: undefined
};

export type PageRuleOptions = {
  /**
   * The action handler context.
   */
  ctx: ActionHandlerContext;
  /**
   * Blocks all static requests except javascript files.
   * Default: `true`
   */
  blockStatic?: boolean;
  /**
   * Default action when no other rule is matching.
   * Default: `deny`
   */
  defaultAction?: Rule["action"];
  /**
   * Try to block popups.
   * Default: false
   */
  blockPopups?: boolean;
  /**
   * Rules to apply.
   * Default: []
   */
  rules?: Partial<Rule>[];
  /**
   * Surpress all log messages.
   * Default: `false`
   */
  silentByDefault?: boolean;
};

const defaultOptions: Partial<PageRuleOptions> = {
  blockStatic: true,
  defaultAction: "deny",
  blockPopups: false,
  rules: [],
  silentByDefault: false
};

const compileRules = (rules: Partial<Rule>[], options: PageRuleOptions) =>
  rules.map(rule => {
    rule = { ...defaultRule, ...rule };
    return {
      check: (resourceType: string, method: Rule["method"], url: string) => {
        if (rule.resourceType && rule.resourceType !== resourceType) {
          return false;
        }
        if (rule.method && rule.method !== method) {
          return false;
        }
        if (rule.url) {
          const urls = Array.isArray(rule.url) ? rule.url : [rule.url];
          const res = urls.find(u => {
            if (typeof u === "string") return url.includes(u);
            return u.test(url);
          });
          if (!res) return false;
        }
        return true;
      },
      action: rule.action,
      cache: rule.cache,
      silent: rule.silent === undefined ? options.silentByDefault : rule.silent
    };
  });

const defaultRules = {
  pre: <Partial<Rule>[]>[
    { url: /^data:/, action: "allow", silent: true },
    { url: /^wss?:/, action: "deny" }
  ],
  static: <Partial<Rule>[]>[
    { resourceType: "stylesheet", action: "deny", silent: true },
    { resourceType: "image", action: "deny", silent: true },
    { resourceType: "other", action: "deny" }
  ]
};

export const setupPageRules = async (page: Page, options?: PageRuleOptions) => {
  const opts = <PageRuleOptions>{ ...defaultOptions, ...options };

  const allRules = [
    ...compileRules(defaultRules.pre, opts),
    ...compileRules(opts.rules ?? [], opts),
    ...compileRules(opts.blockStatic ? defaultRules.static : [], opts),
    ...compileRules([{ action: opts.defaultAction }], opts)
  ];

  if (opts.blockPopups) {
    await page.evaluate("window.open = function(){}");
  }

  await page.setRequestInterception(true);

  page.on("request", async request => {
    const resourceType = request.resourceType();
    const method = request.method();
    const url = request.url();
    let sent = false;

    try {
      const rule = allRules.find(rule => rule.check(resourceType, method, url));
      if (!rule)
        throw new Error(`Found no rule for [${resourceType}] ${method} ${url}`);

      let response: RespondOptions | undefined;
      const cacheKey = rule.cache ? `${method}:${url}` : "";
      if (rule.cache) {
        response = await opts.ctx.cache.get(cacheKey);
        if (response) {
          if ((<any>response.body)?.type === "Buffer") {
            response.body = Buffer.from(<any>response.body);
          }
          if (!rule.silent) {
            console.info(`CACHED: [${resourceType}] ${method} ${url}`);
          }
          sent = true;
          request.respond(response);
          return;
        }
      }

      let action: RuleAction | "noop" | undefined;
      if (typeof rule.action === "function") {
        const res = await rule.action(request);
        if (typeof res === "string") {
          action = res;
        } else if (res) {
          action = "noop";
          response = res;
        }
      } else {
        action = rule.action;
      }

      switch (action ?? opts.defaultAction) {
        default:
          throw new Error(`Unknown rule action ${action}`);
        case "noop":
          if (response === undefined) {
            throw new Error("Response is not set");
          }
          break;
        case "allow": {
          if (!rule.silent) {
            console.info(`ALLOW: [${resourceType}] ${method} ${url}`);
          }
          if (!rule.cache) {
            sent = true;
            request.continue();
            return;
          }
          const res = await fetch(url, {
            method,
            headers: request.headers(),
            body: request.postData(),
            redirect: "follow"
          });
          const headers = {};
          res.headers.forEach((value, key) => {
            headers[key] = value;
          });
          delete headers["content-length"];
          delete headers["connection"];
          delete headers["accept-ranges"];
          response = {
            status: res.status,
            headers,
            body: await res.buffer(),
            contentType: headers["content-type"]
          };
          break;
        }
        case "proxy": {
          if (!rule.silent) {
            console.info(`PROXY: [${resourceType}] ${method} ${url}`);
          }
          const res = await opts.ctx.fetch(url, {
            method: <any>method,
            headers: request.headers(),
            body: request.postData(),
            redirect: "follow"
          });
          const headers = {};
          res.headers.forEach((value, name) => {
            headers[name] = value;
          });
          response = {
            status: res.status,
            headers,
            body: await res.buffer(),
            contentType: res.headers?.["content-type"]
          };
          break;
        }
        case "deny":
          if (!rule.silent) {
            console.info(`DENY: [${resourceType}] ${method} ${url}`);
          }
          sent = true;
          await request.abort();
          return;
      }

      if (rule.cache) {
        await opts.ctx.cache.set(cacheKey, {
          ...response,
          body: Buffer.isBuffer(response.body)
            ? response.body.toJSON()
            : response.body
        });
      }

      sent = true;
      await request.respond(response);
    } catch (error) {
      console.warn(
        `Failed handling [${resourceType}] ${method} ${url}: ${error.message}`
      );
      console.warn(error.stack);
      if (!sent) {
        try {
          request.abort();
        } catch (e) {}
      }
    }
  });
};
