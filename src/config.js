import { getServerValidators } from '@watchedcom/schema';
import debugModule from 'debug';
import { createCache } from './cache';
import { version } from '../package.json';

export const debug = debugModule('watched:sdk');

class Config {
  repository = null;

  cache = null;

  addons = {};

  setInfos(props) {
    this.repository = getServerValidators().models.repositoryAddon({
      version: '1.0.0',
      ...props,
      type: 'repository',
      sdk: {
        engine: 'javascript',
        version,
      },
    });
  }

  setCache(cache) {
    this.cache = cache;
  }

  registerAddon(addon) {
    this.addons[addon.id] = addon;
  }
}

export const config = new Config();

export function setup(props, cache = null) {
  config.setInfos(props);
  config.setCache(cache ?? createCache());
}
