import { getServerValidators } from '@watchedcom/schema';
import express from 'express';
import uuid4 from 'uuid/v4';
import MarkdownIt from 'markdown-it';
import { Context } from './context';
import { config, debug } from './config';

const decodeBody = body => {
  if (typeof body === 'string') return JSON.parse(body);
  if (typeof body === 'object') return body;
  return {};
};

class TunnelResponse {
  constructor(r) {
    this.r = r;
  }

  get error() {
    return this.r.error;
  }

  get status() {
    return this.r.status;
  }

  get url() {
    return this.r.url;
  }

  get headers() {
    return this.r.headers;
  }

  async json() {
    return this.r.json;
  }

  async text() {
    return this.r.text;
  }

  async data() {
    return Buffer.from(this.r.data, 'base64');
  }
}

class HttpContext extends Context {
  constructor(addonId, resource, req, res) {
    super(addonId, resource);
    this.req = req;
    this.res = res;
    this.resultChannel = null;
  }

  async send(status, body) {
    if (this.resultChannel) {
      const data = JSON.stringify({ status, body });
      await config.cache.set(`task:response:${this.resultChannel}`, data);
    } else {
      this.res.status(status).send(body);
    }
  }

  async fetchRemote(url, params, { timeout = 30 * 1000 } = {}) {
    // Create and send task
    const id = uuid4();
    {
      const task = {
        id,
        action: 'fetch',
        url,
        params,
      };
      getServerValidators().task.task(task);
      await config.cache.set(`task:wait:${id}`, '1');
      console.warn('task.create', id);
      await this.send(428, task);
    }

    // Wait for result
    const data = await config.cache.waitKey(`task:result:${id}`, timeout, true);
    const { resultChannel, result } = JSON.parse(data);
    if (!resultChannel) throw new Error('Missing resultChannel');
    this.resultChannel = resultChannel;
    console.warn('task.result.get', result.id);
    getServerValidators().task.result(result);
    return new TunnelResponse(result);
  }
}

const validateResponse = (ctx, status, response) => {
  if (status == 500) {
    getServerValidators().error(response);
  } else if (status == 428) {
    getServerValidators().task.task(response);
  } else {
    ctx.schema.response(response);
  }
};

const handleTaskResult = async (req, res, ctx, result) => {
  getServerValidators().task.result(result);

  // Make sure the key exists to prevent spamming
  if (!(await config.cache.get(`task:wait:${result.id}`))) {
    throw new Error(`Task wait key ${result.id} does not exists`);
  }
  await config.cache.del(`task:wait:${result.id}`);

  // Set the result
  console.warn('task.result.set', result.id);
  const resultChannel = uuid4();
  const raw = JSON.stringify({ resultChannel, result });
  await config.cache.set(`task:result:${result.id}`, raw);

  // Wait for the response
  const data = await config.cache.waitKey(`task:response:${resultChannel}`);
  const { status, body: response } = JSON.parse(data);
  validateResponse(ctx, status, response);
  res.status(status).send(response);
};

const route = async (addonId, action, req, res) => {
  let ctx = res;
  try {
    ctx = new HttpContext(addonId, action, req, res);
    const request = decodeBody(req.body);
    debug(`request: ${addonId}/${action}: ${JSON.stringify(request)}`);
    if (request.kind === 'taskResult') {
      return await handleTaskResult(req, res, ctx, request);
    }

    const response = await ctx.run(request);
    await ctx.send(200, response);
  } catch (error) {
    console.error('error', error.message);
    await ctx.send(500, { error: error.message });
  }
};

export const router = express.Router();

router.get('/health', (req, res) => res.status(200).send('OK'));

const md = new MarkdownIt();

router.use((req, res, next) => {
  if (req.query?.watchedAddonCheck) {
    res.status(200).send({ watched: true, rootPath: config.rootPath });
  } else {
    next();
  }
});

const addonLink = (addon, isChild) => {
  const data = {
    mirrors: config.repository.props.mirrors,
  };
  if (isChild) data.id = addon.id;
  console.warn(data);
  return 'https://wtchd.cm/#' + JSON.stringify(data);
};

const renderAddon = (addon, isChild) =>
  `${isChild ? '##' : '#'} [${addon.name ?? addon.id}](${addonLink(
    addon,
    isChild,
  )})

- ID: \`${addon.id}\`
- Version \`${addon.version}\``;

router.get('/', (req, res) => {
  const html = `${renderAddon(config.repository.props, false)}

${Object.values(config.addons)
  .filter(addon => addon !== config.repository)
  .map(addon => renderAddon(addon.props, true))
  .join('\n\n')}`;
  res.send(md.render(html));
});

router.post('/v1/addons', async (req, res) =>
  route(config.repository.id, 'addons', req, res),
);
router.post('/v1/:addonId', async (req, res) =>
  route(req.params.addonId, 'infos', req, res),
);
router.post('/v1/:addonId/:action', async (req, res) =>
  route(req.params.addonId, req.params.action, req, res),
);
