import { TaskNotificationRequest } from "@mediaurl/schema";
import { CacheHandler } from "../cache";
import { Responder, sendTask } from "./engine";
import { NotificationFn } from "./types";

export const createTaskNotification = (
  testMode: boolean,
  responder: Responder,
  cache: CacheHandler
) => {
  const notification: NotificationFn = async (props, timeout = 60 * 1000) => {
    if (testMode) {
      throw new Error("Task notification is not available in test mode");
    }
    const task = <TaskNotificationRequest>{ ...props, type: "notification" };
    await sendTask(testMode, responder, cache, task, timeout);
  };
  return notification;
};
