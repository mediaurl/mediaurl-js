import {
  TaskRecaptchaRequest,
  TaskRecaptchaResponse
} from "@watchedcom/schema";
import * as uuid4 from "uuid/v4";
import { CacheHandler } from "../cache";
import { Responder, sendTask } from "./utils";

export type RecaptchaFn = (
  url: TaskRecaptchaRequest["url"],
  siteKey: TaskRecaptchaRequest["siteKey"],
  version?: TaskRecaptchaRequest["version"],
  action?: TaskRecaptchaRequest["action"]
) => Promise<string>;

export const createTaskRecaptcha = (
  responder: Responder,
  cache: CacheHandler
) => {
  const recaptcha: RecaptchaFn = async (
    url,
    siteKey,
    version = "v2",
    action = "",
    timeout = 60 * 1000
  ) => {
    const task: TaskRecaptchaRequest = {
      kind: "task",
      type: "recaptcha",
      id: uuid4(),
      url,
      siteKey,
      version,
      action
    };
    const res = <TaskRecaptchaResponse>(
      await sendTask(responder, cache, task, timeout)
    );
    if (res.error) throw new Error(res.error);
    if (!res.token) throw new Error("No recaptcha token returned");
    return res.token;
  };
  return recaptcha;
};
