import { TaskFetchRequest, TaskFetchResponse } from "@watchedcom/schema";
import { Response, ResponseInit } from "node-fetch";
import { CacheHandler } from "../cache";
import { Responder, sendTask } from "./utils";

export type FetchFn = (
  url: TaskFetchRequest["url"],
  params?: TaskFetchRequest["params"],
  timeout?: number
) => Promise<Response>;

export const createTaskFetch = (responder: Responder, cache: CacheHandler) => {
  const fetch: FetchFn = async (url, params, timeout = 30 * 1000) => {
    const task: TaskFetchRequest = {
      type: "fetch",
      url,
      params
    };
    const response = <TaskFetchResponse>(
      await sendTask(responder, cache, task, timeout)
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
  return fetch;
};
