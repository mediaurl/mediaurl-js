import { TaskFetchRequest, TaskFetchResponse } from "@watchedcom/schema";
import fetch, { Response, ResponseInit } from "node-fetch";
import { CacheHandler } from "../cache";
import { IServeAddonsOptions } from "../interfaces";
import { Responder, sendTask } from "./utils";

export type FetchFn = (
  url: TaskFetchRequest["url"],
  params?: TaskFetchRequest["params"],
  timeout?: number
) => Promise<Response>;

export const createTaskFetch = (
  opts: IServeAddonsOptions,
  responder: Responder,
  cache: CacheHandler
): FetchFn => {
  if (opts.replayMode) {
    return async (url, params, timeout = 0) => {
      console.debug(`Using mocked fetch for ${params?.method ?? "GET"} ${url}`);
      return await fetch(url, params);
    };
  } else {
    return async (url, params, timeout = 30 * 1000) => {
      const task: TaskFetchRequest = {
        type: "fetch",
        url,
        params
      };
      const response = <TaskFetchResponse>(
        await sendTask(opts, responder, cache, task, timeout)
      );

      if (response.status === 0) throw new Error(response.error);

      const init: ResponseInit = {
        headers: response.headers,
        status: response.status,
        url: response.url
      };

      let body: string | ArrayBuffer | undefined = undefined;
      if (response.text) {
        body = response.text;
        init.size = response.text.length;
      } else if (response.data) {
        body = Buffer.from(response.data, "base64");
        init.size = body.byteLength;
      }

      return new Response(body, init);
    };
  }
};
