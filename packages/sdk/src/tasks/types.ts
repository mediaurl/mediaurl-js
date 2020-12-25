import {
  TaskNotificationRequest,
  TaskRecaptchaRequest,
} from "@mediaurl/schema";
import {
  RequestInfo as FetchRequestInfo,
  RequestInit as FetchRequestInit,
  Response,
  ResponseInit as FetchResponseInit,
} from "node-fetch";
import { URLSearchParams } from "url";

// Fetch

export type RequestInfo = FetchRequestInfo;

export type RequestInit = FetchRequestInit & {
  /**
   * Shorthand to set the URL query string.
   */
  qs?: URLSearchParams | Record<string, string>;

  /**
   * Shorthand to send JSON data.
   */
  json?: any;

  /**
   * Do this request `direct` or `proxy` it via the client connection.
   * Default: `proxy`
   */
  connection?: "direct" | "proxy";
};

export type ResponseInit = FetchResponseInit;

export type FetchFn = (
  url: RequestInfo,
  init?: RequestInit,
  timeout?: number
) => Promise<Response>;

// Recaptcha

export type RecaptchaFn = (
  data: Omit<TaskRecaptchaRequest, "type">,
  timeout?: number
) => Promise<string>;

// Toast

export type ToastFn = (text: string) => Promise<void>;

// Notification

export type NotificationFn = ({
  caption,
  text,
  url,
  closeOnClick,
  theme,
  timeout,
}: {
  caption?: string;
  text?: string;
  url?: string;
  closeOnClick?: boolean;
  theme?: TaskNotificationRequest["theme"];
  timeout?: number;
}) => Promise<void>;
