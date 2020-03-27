import { TaskFetchRequest, TaskFetchResponse } from "@watchedcom/schema";
import { CacheHandler } from "../cache";
import { Responder, sendTask } from "./utils";

class FetchResponse {
  constructor(private r: TaskFetchResponse) {}

  get error() {
    return this.r.error;
  }

  get status() {
    return this.r.status;
  }

  get url() {
    return this.r.url;
  }

  get ok() {
    const status = this.r.status;
    return status >= 200 && status < 300;
  }

  get headers() {
    return this.r.headers;
  }

  async json<T = any>(): Promise<T> {
    if (this.r.json) return <T>this.r.json; // LEGACY
    return JSON.parse(await this.text());
  }

  async text(): Promise<string> {
    if (this.r.text) return this.r.text;
    if (this.r.data) return Buffer.from(this.r.data, "base64").toString();
    throw new Error("No text or data in task response");
  }

  async data() {
    if (this.r.data) return Buffer.from(this.r.data, "base64");
    return Buffer.from(<string>this.r.text, "ascii");
  }
}

export type FetchFn = (
  url: TaskFetchRequest["url"],
  params?: TaskFetchRequest["params"],
  timeout?: number
) => Promise<FetchResponse>;

// export const dummyFetch: FetchFn = async (url, params) => {
//   const response: TaskFetchResponse = {
//     type: "fetch",
//     id: "",
//     status: 0
//   };
//   try {
//     const res = await fetch(url, params);
//     response.status = res.status;
//     response.url = res.url;
//     response.headers = res.headers;

//     const ct = String(res.headers.get("content-type")).toLowerCase();
//     if (ct.indexOf("text/") === 0 || ct.includes("json")) {
//       response.text = await res.text();
//     } else {
//       const blob = await res.blob();
//       await new Promise(resolve => {
//         const reader = new FileReader();
//         reader.addEventListener("load", () => {
//           if (reader.result !== null) {
//             if (typeof reader.result === "string") {
//               response.text = reader.result;
//             } else {
//               response.data = Buffer.from(reader.result).toString("base64");
//             }
//           }
//           resolve();
//         });
//         reader.readAsDataURL(blob);
//       });
//     }
//   } catch (error) {
//     response.error = error.message;
//   }
//   return new FetchResponse(response);
// };

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

    // Return fetch response
    const res = new FetchResponse(response);
    if (res.status === 0) throw new Error(res.error);
    return res;
  };
  return fetch;
};
