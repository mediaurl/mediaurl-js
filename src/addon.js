/*eslint no-unused-vars: [2, { "args": "none" }]*/
import { getServerValidators } from '@watchedcom/schema';
import { config } from './config';

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
    const props = this.getProps();
    getServerValidators().models.addon({
      type: 'worker',
      ...props,
    });
    this.props = props;
    config.registerAddon(this);
  }

  getProps() {
    throw new Error('Not implemented');
  }

  get id() {
    return this.props.id;
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
