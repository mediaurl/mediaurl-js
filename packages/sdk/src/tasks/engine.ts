import { TaskRequest, TaskResponse } from "@mediaurl/schema";
import { EventEmitter } from "events";
import { v4 as uuid4 } from "uuid";
import { BasicAddonClass } from "../addons";
import { CacheHandler, IgnoreCacheError } from "../cache";
import { SilentError } from "../errors";
import { SendResponseFn } from "../types";

export class Responder {
  queue: string[];
  emitter: EventEmitter;
  sendResponse: null | SendResponseFn;

  constructor(fn: SendResponseFn) {
    this.queue = [];
    this.emitter = new EventEmitter();
    this.sendResponse = fn;
  }

  async send(statusCode: number, body: any, queueTimeout = 30 * 1000) {
    // Since there can be always only one task, create a queue
    const id = uuid4().toString();
    this.queue.push(id);
    if (this.queue[0] !== id) {
      console.debug(`Task queue length ${this.queue.length}, waiting...`);
      await new Promise<void>((resolve, reject) => {
        const on = () => {
          if (this.queue[0] === id) {
            this.emitter.removeListener("event", on);
            resolve();
          }
        };
        this.emitter.addListener("event", on);
        setTimeout(() => {
          this.emitter.removeListener("event", on);
          const i = this.queue.indexOf(id);
          if (i !== -1) this.queue.splice(i, 1);
          reject(new IgnoreCacheError("Waiting for task slot timed out"));
        }, queueTimeout);
      });
    }

    // Make sure we have a sendResponse handle
    const sendResponse = this.sendResponse;
    if (sendResponse === null) {
      // When `sendResponse` is not set, it means that either the queue function
      // has a bug, or the responder was used after it sent the final response
      console.warn("Send response is not set, client connection is broken");
    } else {
      this.sendResponse = null;

      // Send the response
      await sendResponse(statusCode, body);
    }

    // Return the queue id
    return id;
  }

  setSendResponse(id: string, fn: null | SendResponseFn) {
    if (this.queue[0] !== id) {
      throw new Error(`First queue element is not the current id`);
    }
    this.queue.shift();

    this.sendResponse = fn;
    this.emitter.emit("event");
  }
}

export const sendTask = async (
  testMode: boolean,
  responder: Responder,
  cache: CacheHandler,
  taskRequestData: TaskRequest["data"],
  timeout = 30 * 1000
): Promise<TaskResponse["data"]> => {
  if (testMode) {
    throw new Error(
      `Can not run client task "${taskRequestData.type}" in test mode`
    );
  }

  const task: TaskRequest = {
    kind: "taskRequest",
    id: uuid4().toString(),
    data: taskRequestData,
  };
  // getServerValidators().models.task.request(task);
  // console.debug(`Task ${task.id} is starting`);
  await cache.set(`task.wait-${task.id}`, "1", timeout * 2);
  const id = await responder.send(200, task);

  // Wait for the response
  let data: string;
  try {
    data = await cache.waitKey(`task.response-${task.id}`, timeout, true);
  } catch (error) {
    if (error.message === "Wait timed out") {
      console.warn(
        `Task ${task.id} timed out, destroying connection to client`
      );
      responder.setSendResponse(id, null);
      throw new SilentError("Task timed out");
    }
    throw error;
  }
  const { responseChannel, response } = JSON.parse(data);
  // getServerValidators().models.task.response(response);
  // console.debug(`Task ${task.id} resolved`);

  // Set new valid responder
  responder.setSendResponse(id, async (statusCode, body) => {
    const data = JSON.stringify({ statusCode, body });
    await cache.set(`task.response-${responseChannel}`, data, timeout);
  });

  // Check for errors
  if (response.type === "error")
    throw new Error(`Client error: ${response.error}`);

  // Return response
  return response;
};

type HandleTaskProps = {
  cache: CacheHandler;
  addon: BasicAddonClass;
  timeout?: number;
  input: any;
  sendResponse: SendResponseFn;
};

export const handleTask = async ({
  cache,
  addon,
  timeout = 120 * 1000,
  input,
  sendResponse,
}: HandleTaskProps) => {
  cache = cache.clone({
    prefix: addon.getId(),
    ...addon.getDefaultCacheOptions(),
  });

  const task: TaskResponse = input;
  // getServerValidators().models.task.response(task);
  // console.debug(`Task ${task.id} received response from client`);

  // Make sure the key exists to prevent spamming
  if (!(await cache.get(`task.wait-${task.id}`))) {
    console.warn(`Task ${task.id} not found or timed out`);
    await sendResponse(500, { error: "Task not found or timed out" });
    return;
  }
  await cache.delete(`task.wait-${task.id}`);

  // Set the response
  const responseChannel = uuid4().toString();
  const raw = JSON.stringify({ responseChannel, response: task.data });
  await cache.set(`task.response-${task.id}`, raw);

  // Wait for the response
  const data = await cache.waitKey(
    `task.response-${responseChannel}`,
    timeout,
    true
  );
  const { statusCode, body } = JSON.parse(data);

  await sendResponse(statusCode, body);
  // console.debug(`Task ${task.id} sending next response to client`);
};
