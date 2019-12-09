/*eslint no-unused-vars: [2, { "args": "none" }]*/
import appRootPath from 'app-root-path';
import { getServerValidators } from '@watchedcom/schema';
import { config } from './config';

const rootPackage = appRootPath.require('./package');

const defaults = {
  id: rootPackage.name,
  name: rootPackage.description ?? rootPackage.name,
  version: rootPackage.version ?? '0.0.0',
  homepage: rootPackage.homepage || rootPackage.repository,
};

const hardCopy = obj => {
  if (Array.isArray(obj)) {
    return obj.map(hardCopy);
  }
  if (typeof obj === 'object') {
    const n = {};
    for (const key of Object.keys(obj)) {
      n[key] = hardCopy(obj[key]);
    }
    return n;
  }
  return obj;
};

export class Addon {
  constructor() {
    const props = {
      type: 'worker',
      ...this.getProps(),
    };
    this.props = getServerValidators().models.addon({
      id: `${config.repository?.id ?? defaults.id}.${props.type}`,
      name: config.repository?.name ?? defaults.name,
      version: config.repository?.version ?? defaults.version,
      homepage: config.repository?.homepage ?? defaults.homepage,
      ...props,
    });
    config.registerAddon(this);
  }

  getProps() {
    throw new Error('Not implemented');
  }

  get id() {
    return this.props.id;
  }

  get type() {
    return this.props.type;
  }

  async cacheGet(key) {
    return config.cache.get(`${this.id}/${key}`);
  }

  async cacheSet(key, value, ttl = 24 * 3600) {
    return config.cache.set(`${this.id}/${key}`, value, ttl);
  }

  async cacheDel(key) {
    return config.cache.del(`${this.id}/${key}`);
  }

  async infos(ctx, args) {
    return hardCopy(this.props);
  }

  async directory(ctx, args) {
    throw new Error('Not implemented');
  }

  async metadata(ctx, args) {
    throw new Error('Not implemented');
  }

  async sources(ctx, args) {
    throw new Error('Not implemented');
  }

  async subtitles(ctx, args) {
    throw new Error('Not implemented');
  }

  async resolve(ctx, args) {
    throw new Error('Not implemented');
  }
}

export function createAddon(props) {
  class MyAddon extends Addon {
    getProps() {
      return props;
    }

    on(action, fn) {
      this[action] = fn.bind(this);
      return this;
    }
  }

  return new MyAddon();
}

export function setupRepository(props) {
  createAddon({
    id: defaults.id,
    name: defaults.name,
    version: defaults.version,
    homepage: defaults.homepage,
    mirrors: rootPackage.homepage ? [rootPackage.homepage] : [],
    ...(props ?? {}),
    type: 'repository',
  });
}
