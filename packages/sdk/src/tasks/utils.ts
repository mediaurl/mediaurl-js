import { TaskRequest, TaskResponse } from "@watchedcom/schema";
import { EventEmitter } from "events";
import { RequestHandler } from "express";
import { v4 as uuid4 } from "uuid";
import { BasicAddonClass } from "../addons";
import { CacheHandler } from "../cache";

type TransportFn = (statusCode: number, body: any) => Promise<any>;

export class Responder {
  queue: string[];
  emitter: EventEmitter;
  transport: TransportFn;

  constructor(fn: TransportFn) {
    this.queue = [];
    this.emitter = new EventEmitter();
    this.setTransport(fn);
  }

  async send(statusCode: number, body: any, queueTimeout = 30 * 1000) {
    const id = uuid4().toString();
    this.queue.push(id);
    if (this.queue[0] !== id) {
      console.debug(`Task queue length ${this.queue.length}, waiting...`);
      await new Promise((resolve, reject) => {
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
          reject("Waiting for slot timed out");
        }, queueTimeout);
      });
    }
    let res;
    try {
      res = await this.transport(statusCode, body);
    } finally {
      if (this.queue[0] !== id) {
        throw new Error(`First queue element is not the current id`);
      }
      this.queue.shift();
    }
    return res;
  }

  setTransport(fn: TransportFn) {
    this.transport = fn;
    this.emitter.emit("event");
  }
}

export const sendTask = async (
  responder: Responder,
  cache: CacheHandler,
  taskRequestData: TaskRequest["data"],
  timeout = 30 * 1000
): Promise<TaskResponse["data"]> => {
  const task: TaskRequest = {
    kind: "taskRequest",
    id: uuid4().toString(),
    data: taskRequestData
  };
  // getServerValidators().task.request(task);
  // console.debug(`Task ${task.id} is starting`);
  await cache.set(`task.wait:${task.id}`, "1", timeout * 2);
  await responder.send(200, task);

  // Wait for the response
  const data: any = await cache.waitKey(
    `task.response:${task.id}`,
    timeout,
    true
  );
  const { responseChannel, response } = JSON.parse(data);
  // getServerValidators().task.response(response);
  // console.debug(`Task ${task.id} resolved`);

  // Set new valid responder
  responder.setTransport(async (statusCode, body) => {
    const data = JSON.stringify({ statusCode, body });
    await cache.set(`task.response:${responseChannel}`, data, timeout);
  });

  // Check for errors
  if (response.type === "error")
    throw new Error(`Client error: ${response.error}`);

  // Return response
  return response;
};

export const createTaskResponseHandler = (
  addon: BasicAddonClass,
  cache: CacheHandler,
  timeout = 120 * 1000
) => {
  const taskHandler: RequestHandler = async (req, res) => {
    cache = cache.clone({
      prefix: [addon.getId(), addon.getVersion(), req.params[0]]
    });

    const task: TaskResponse = req.body;
    // getServerValidators().task.response(response);
    // console.debug(`Task ${task.id} received response from client`);

    // Make sure the key exists to prevent spamming
    if (!(await cache.get(`task.wait:${task.id}`))) {
      throw new Error(`Task wait key ${task.id} does not exist`);
    }
    await cache.delete(`task.wait:${task.id}`);

    // Set the response
    const responseChannel = uuid4().toString();
    const raw = JSON.stringify({ responseChannel, response: task.data });
    await cache.set(`task.response:${task.id}`, raw);

    // Wait for the response
    const data = await cache.waitKey(
      `task.response:${responseChannel}`,
      timeout,
      true
    );
    const { statusCode, body } = JSON.parse(data);
    res.status(statusCode).json(body);
    // console.debug(`Task ${task.id} sending next response to client`);
  };

  return taskHandler;
};
