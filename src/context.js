import { getServerValidators } from '@watchedcom/schema';
import fetch from 'node-fetch';
import { config } from './config';

export class Context {
  constructor(addonId, action) {
    this.action = action;

    if (addonId === 'repository') {
      addonId = config.repository.id;
    } else if (addonId.indexOf('.') === 0) {
      addonId = config.repository.id + addonId;
    }
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
        if (addonId !== config.repository.id) {
          throw new Error('Action addons only allowed for this repository');
        }
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
