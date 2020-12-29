import {
  AddonRequest,
  BasicAddonActions,
  BasicAddonClass,
  BundleAddonActions,
  createApp,
  createEngine,
  DefaultAddonRequest,
  DirectoryItem,
  DirectoryRequest,
  IptvAddonActions,
  ItemRequest,
  MainItem,
  PlayableItem,
  RepositoryAddonActions,
  RepositoryRequest,
  SeriesItem,
  SourceRequest,
  SubItem,
  SubtitleRequest,
  WorkerAddonActions,
  WorkerAddonClass,
  WorkerAddonResourceActions,
} from "@mediaurl/sdk";
import assert from "assert";
import request from "supertest";

export class AddonTest {
  public readonly app: request.SuperTest<request.Test>;

  constructor(public readonly addon: BasicAddonClass) {
    const engine = createEngine([this.addon], { testMode: true });
    this.app = request(createApp(engine));
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
      .post(`/${this.addon.getId()}/${action}.json`)
      .send(<any>data)
      .expect(expectedStatus);
  }
}

export const testAddon = async (addon: BasicAddonClass) => {
  console.warn("WARNING: The testAddon function is legacy!");
  console.warn(
    "WARNING: To test addons, it is recommended to use request recording"
  );

  const requestDefaults: DefaultAddonRequest = {
    sig: "mock",
    language: "en",
    region: "UK",
  };

  const directoryDefaults: DirectoryRequest = {
    ...requestDefaults,
    id: "",
    adult: false,
    search: "",
    sort: "",
    filter: {},
    cursor: null,
  };

  const app = new AddonTest(addon);

  await app.call("addon", <AddonRequest>{ ...requestDefaults });

  const type = addon.getType();

  if (type === "repository") {
    await app.call<RepositoryRequest>("repository", { ...requestDefaults });
  } else if (type === "worker") {
    const directories: DirectoryItem[] = [];
    const items: PlayableItem[] = [];

    const addItem = (item: MainItem) => {
      if (item.type === "directory" && directories.length < 10)
        directories.push(item);
      else if (items.length < 10) items.push(<PlayableItem>item);
    };

    const hasAction = (action: WorkerAddonResourceActions) =>
      (<WorkerAddonClass>addon).getProps().actions.includes(action);

    if (hasAction("directory")) {
      console.log('directory "root"');
      const res = await app.call<DirectoryRequest>("directory", {
        ...directoryDefaults,
      });
      assert(!!res.body.items);
      res.body.items.forEach(addItem);
      console.log(`subtitle "root": Found ${res.body.items.length}`);

      for (const directory of directories) {
        console.log(`directory "${directory.name}"`);
        const res = await app.call<DirectoryRequest>("directory", {
          ...directoryDefaults,
          id: directory.id ?? "",
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
          id: item.ids[addon.getId()],
        },
        name: item.name,
        nameTranslations: {},
        releaseDate: item.releaseDate,
      };

    const sourceRequest = (item: PlayableItem, subItem?: SubItem) =>
      <SourceRequest | SubtitleRequest>{
        ...itemRequest(item),
        episode: subItem
          ? {
              ids: {
                ...subItem.ids,
                id: subItem.ids[addon.getId()],
              },
              name: subItem.name,
              releaseDate: subItem.releaseDate,
              season: subItem.season,
              episode: subItem.episode,
            }
          : undefined,
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
          sourceRequest(item, (<SeriesItem>item).episodes?.[0])
        );
        console.log(`source "${item.name}": Found ${res.body.length}`);
      }
    }

    if (hasAction("subtitle")) {
      for (const item of items) {
        console.log(`subtitle "${item.name}"`);
        const res = await app.call(
          "subtitle",
          sourceRequest(item, (<SeriesItem>item).episodes?.[0])
        );
        console.log(`subtitle "${item.name}": Found ${res.body.length}`);
      }
    }
  }
};
