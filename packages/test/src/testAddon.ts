import {
  AddonRequest,
  BasicAddonActions,
  BundleAddonActions,
  createApp,
  DirectoryItem,
  DirectoryRequest,
  IptvAddonActions,
  ItemRequest,
  MainItem,
  PlayableItem,
  RepositoryAddonActions,
  RepositoryRequest,
  SourceRequest,
  SubItem,
  SubtitleRequest,
  WorkerAddonActions
} from "@watchedcom/sdk";
import { BasicAddon, WorkerAddon } from "@watchedcom/sdk/dist/addons";
import * as assert from "assert";
import * as request from "supertest";

export class AddonTest {
  public readonly app: request.SuperTest<request.Test>;

  constructor(public readonly addon: BasicAddon) {
    this.app = request(createApp([this.addon]));
  }

  async call<T extends any>(
    action:
      | BasicAddonActions
      | RepositoryAddonActions
      | WorkerAddonActions
      | IptvAddonActions
      | BundleAddonActions,
    data: T,
    expectedStatus = 200
  ) {
    return await this.app
      .post(`/${this.addon.getId()}/${action}`)
      .send(data)
      .expect(expectedStatus);
  }
}

export const testAddon = async (addon: BasicAddon) => {
  const requestDefaults = {
    sig: "mock",
    language: "en",
    region: "UK"
  };

  const app = new AddonTest(addon);

  await app.call("addon", <AddonRequest>{ ...requestDefaults });

  const type = addon.getType();

  if (type === "repository") {
    await app.call<RepositoryRequest>("repository", { ...requestDefaults });
  } else if (type === "worker") {
    const testData = (<WorkerAddon>addon).getTestData();
    const directories = <DirectoryItem[]>(
      testData.items.filter(item => item.type === "directory")
    );
    const items = <PlayableItem[]>(
      testData.items.filter(item => item.type !== "directory")
    );

    const addItem = (item: MainItem) => {
      if (item.type === "directory" && directories.length < 10)
        directories.push(item);
      else if (items.length < 10) items.push(<PlayableItem>item);
    };

    const hasAction = (action: WorkerAddonActions) =>
      addon.getProps().actions.includes(action);

    if (hasAction("directory")) {
      console.log('directory "root"');
      const res = await app.call<DirectoryRequest>("directory", {
        ...requestDefaults,
        id: ""
      });
      assert(!!res.body.items);
      res.body.items.forEach(addItem);
      console.log(`subtitle "root": Found ${res.body.items.length}`);

      for (const directory of directories) {
        console.log(`directory "${directory.name}"`);
        const res = await app.call<DirectoryRequest>("directory", {
          ...requestDefaults,
          id: directory.id
        });
        assert(!!res.body.items);
        res.body.items.forEach(addItem);
        console.log(
          `subtitle "${directory.name}": Found ${res.body.items.length}`
        );
      }
    }

    const itemRequest = (item: PlayableItem) =>
      <ItemRequest>{
        ...requestDefaults,
        type: item.type,
        ids: {
          ...item.ids,
          id: item.ids[addon.getId()]
        },
        name: item.name,
        releaseDate: item.releaseDate
      };

    const sourceRequest = (item: PlayableItem, subItem?: SubItem) =>
      <SourceRequest | SubtitleRequest>{
        ...itemRequest(item),
        episode: subItem
          ? {
              ids: {
                ...subItem.ids,
                id: subItem.ids[addon.getId()]
              },
              name: subItem.name,
              releaseDate: subItem.releaseDate,
              season: subItem.season,
              episode: subItem.episode
            }
          : undefined
      };

    if (hasAction("item")) {
      for (const item of items) {
        console.log(`item "${item.name}"`);
        const res = await app.call("item", itemRequest(item));
        console.log(`item "${item.name}": Found ${!!res.body}`);
      }
    }

    if (hasAction("source")) {
      for (const item of items) {
        console.log(`source "${item.name}"`);
        const res = await app.call(
          "source",
          sourceRequest(item, item.episodes?.[0])
        );
        console.log(`source "${item.name}": Found ${res.body.length}`);
      }
    }

    if (hasAction("subtitle")) {
      for (const item of items) {
        console.log(`subtitle "${item.name}"`);
        const res = await app.call(
          "subtitle",
          sourceRequest(item, item.episodes?.[0])
        );
        console.log(`subtitle "${item.name}": Found ${res.body.length}`);
      }
    }
  }
};
