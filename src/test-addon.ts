import {
  AddonRequest,
  DirectoryItem,
  DirectoryRequest,
  ItemRequest,
  PlayableItem,
  RepositoryRequest,
  SourceRequest,
  SubItem,
  SubtitleRequest
} from "@watchedcom/schema";
import * as assert from "assert";
import * as request from "supertest";
import { BasicAddon } from "./addons";
import { createApp } from "./server";

export const testAddon = (addon: BasicAddon) => {
  describe(`Addon ${addon.getId()}`, () => {
    const requestDefaults = {
      sig: "mock",
      language: "en",
      region: "UK"
    };

    const app = request(createApp([addon]));

    test("action addon", async done => {
      app
        .post(`/${addon.getId()}/addon`)
        .send(<AddonRequest>{ ...requestDefaults })
        .expect(200, addon.getProps())
        .end(done);
    });

    const type = addon.getType();

    if (type === "repository") {
      test("action repository", async done => {
        app
          .post(`/${addon.getId()}/repository`)
          .send(<RepositoryRequest>{ ...requestDefaults })
          .expect(200)
          .end(done);
      });
    } else if (type === "worker") {
      test("worker actions", async done => {
        const directories: DirectoryItem[] = [];
        const items: PlayableItem[] = [];

        if (addon.getProps().actions.includes("directory")) {
          console.log('directory "root"');
          const res = await app
            .post(`/${addon.getId()}/directory`)
            .send(<DirectoryRequest>{
              ...requestDefaults,
              id: ""
            })
            .expect(200);
          assert(!!res.body.items);
          for (const item of res.body.items) {
            if (item.type === "directory") directories.push(item);
            else items.push(item);
          }

          for (const directory of directories) {
            console.log(`directory "${directory.id}"`);
            const res = await app
              .post(`/${addon.getId()}/directory`)
              .send(<DirectoryRequest>{
                ...requestDefaults,
                id: directory.id
              })
              .expect(200);
            assert(!!res.body.items);
            for (const item of res.body.items) {
              if (item.type === "directory") directories.push(item);
              else items.push(item);
            }
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
            subItem: subItem
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

        if (addon.getProps().actions.includes("item")) {
          for (const item of items) {
            console.log(`item "${item.name}"`);
            const res = await app
              .post(`/${addon.getId()}/item`)
              .send(itemRequest(item))
              .expect(200);
          }
        }

        if (addon.getProps().actions.includes("source")) {
          for (const item of items) {
            console.log(`source "${item.name}"`);
            const res = await app
              .post(`/${addon.getId()}/source`)
              .send(sourceRequest(item))
              .expect(200);
          }
        }

        if (addon.getProps().actions.includes("subtitle")) {
          for (const item of items) {
            console.log(`subtitle "${item.name}"`);
            const res = await app
              .post(`/${addon.getId()}/subtitle`)
              .send(sourceRequest(item))
              .expect(200);
          }
        }

        done();
      });
    }
  });
};
