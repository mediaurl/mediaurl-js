import { getServerValidators } from '@watchedcom/schema';
import fetch from 'node-fetch';
import { config } from './config';

const ACTIONS = [
  'repository',
  'infos',
  'directory',
  'metadata',
  'source',
  'subtitle',
  'resolve',
];

const getFunction = (addonId, action) => {
  if (!addonId) {
    if (action === 'repository') {
      // eslint-disable-next-line no-unused-vars
      return async (ctx, args) => config.repository;
    }

    if (!addonId && action === 'addons') {
      return async (ctx, args) =>
        await Promise.all(
          Object.values(config.addons).map(addon =>
            addon.infos(ctx, { ...args, index: true }),
          ),
        );
    }
  }

  const addon = config.addons[addonId];
  if (!addon) {
    throw new Error(`Addon ${addonId} not found (requested action ${action})`);
  }
  if (action === 'infos') {
    return async (ctx, args) =>
      await addon.infos(ctx, { ...args, index: false });
  }

  if (!ACTIONS.includes(action)) {
    throw new Error(`Resource ${action} not found`);
  }

  return async (ctx, args) => await addon[action](ctx, args);
};

export class Context {
  constructor(addonId, action) {
    this.addonId = addonId;
    this.action = action;
    this.fn = getFunction(addonId, action);
  }

  get schema() {
    const schema = getServerValidators().actions[this.action];
    if (!schema) throw new Error(`Found no schema for action ${this.action}`);
    return schema;
  }

  async run(request) {
    this.schema.request(request);
    const response = await this.fn(this, request);
    this.schema.response(response);
    return response;
  }

  async fetch(props) {
    return await fetch(props);
  }

  async fetchRemote(props) {
    return await this.fetch(props);
  }
}
