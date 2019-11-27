import debugModule from 'debug';

export const debug = debugModule('watched:sdk');

class Config {
  cache = null;
  repository = null;
  addons = {};

  setCache(cache) {
    this.cache = cache;
  }

  setRepository(repository) {
    if (this.repository) throw new Error('Repository already set');
    this.repository = repository;
  }

  registerAddon(addon) {
    if (this.addons[addon.id]) {
      throw new Error(`Addon ${addon.id} already exists`);
    }
    this.addons[addon.id] = addon;
  }
}

export const config = new Config();
