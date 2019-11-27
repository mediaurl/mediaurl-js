import { getServerValidators } from '@watchedcom/schema';
import fetch from 'node-fetch';
import { config } from './config';

export class Context {
  constructor(addonId, action) {
    this.addonId = addonId;
    this.action = action;
    const addon = config.addons[addonId];
    if (!addon) {
      throw new Error(
        `Addon ${addonId} not found (requested action ${action})`,
      );
    }

    switch (action) {
      default:
        throw new Error(`Unknown action: ${action}`);

      case 'infos':
        this.fn = async (ctx, args) =>
          await addon.infos(ctx, { ...args, index: false });
        break;

      case 'addons':
        this.fn = async (ctx, args) =>
          await Promise.all(
            Object.values(config.addons).map(addon =>
              addon.infos(ctx, { ...args, index: true }),
            ),
          );
        break;

      case 'directory':
      case 'metadata':
      case 'source':
      case 'subtitle':
      case 'resolve':
        this.fn = async (ctx, args) => await addon[action](ctx, args);
        break;
    }
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
