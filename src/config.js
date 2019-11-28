import debugModule from 'debug';
import appRootPath from 'app-root-path';

export const debug = debugModule('watched:sdk');

class Config {
  cache = null;
  repository = null;
  rootPath = null;
  rootPackage = appRootPath.require('./package');
  addons = {};

  setCache(cache) {
    this.cache = cache;
  }

  setRepository(repository) {
    if (this.repository) throw new Error('Repository already set');
    this.repository = repository;
  }

  setRootPath(rootPath) {
    this.rootPath = rootPath;
  }

  setRootPackage(rootPackage) {
    this.rootPackage = rootPackage;
  }

  registerAddon(addon) {
    if (
      addon.id === 'repository' ||
      addon.id === 'addons' ||
      (addon.type === 'repository' && !/^[a-z0-9\\-]+$/.test(addon.id)) ||
      (addon.type !== 'repository' &&
        !/^[a-z0-9\\-]+\.[a-z0-9\\-\\.]+$/.test(addon.id))
    ) {
      throw new Error(`Addon ID ${addon.id} for ${addon.type} is forbidden`);
    }
    if (this.addons[addon.id]) {
      throw new Error(`Addon ${addon.id} already exists`);
    }
    this.addons[addon.id] = addon;
  }
}

export const config = new Config();
