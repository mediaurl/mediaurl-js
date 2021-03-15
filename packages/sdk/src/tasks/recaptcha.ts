import { CacheHandler } from "@mediaurl/cache";
import { TaskRecaptchaRequest, TaskRecaptchaResponse } from "@mediaurl/schema";
import { Responder, sendTask } from "./engine";
import { RecaptchaFn } from "./types";

const defaults: Partial<TaskRecaptchaRequest> = {
  version: 2,
  action: "",
};

export const createTaskRecaptcha = (
  testMode: boolean,
  responder: Responder,
  cache: CacheHandler
) => {
  const recaptcha: RecaptchaFn = async (data, timeout = 60 * 1000) => {
    if (testMode) {
      throw new Error("Task recaptcha is not available in test mode");
    }
    const task = <TaskRecaptchaRequest>{
      ...defaults,
      ...data,
      type: "recaptcha",
    };
    const res = <TaskRecaptchaResponse>(
      await sendTask(testMode, responder, cache, task, timeout)
    );
    return res.token;
  };
  return recaptcha;
};
