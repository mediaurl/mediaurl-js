import { ActionHandlerContext } from "@watchedcom/sdk";
import { Response } from "node-fetch";
import { Page, Request, RespondOptions } from "puppeteer-core";
import * as setCookieParser from "set-cookie-parser";

export const makeFetchRequest = async (
  ctx: ActionHandlerContext,
  connection: "direct" | "proxy",
  page: Page,
  request: Request
) => {
  const headers = request.headers();
  const cookie = (await page.cookies(request.url()))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (cookie) headers.cookie = cookie;
  const res = await ctx.fetch(request.url(), {
    method: <any>request.method(),
    headers,
    body: request.postData(),
    redirect: "manual",
    connection,
  });
  return await convertFetchResponse(page, res);
};

export const convertFetchResponse = async (
  page: Page,
  res: Response
): Promise<RespondOptions> => {
  const parsedCookies = setCookieParser.parse(
    <string>res.headers.get("set-cookie"),
    { decodeValues: true }
  );
  const cookies: any[] = [];
  for (const cookie of parsedCookies) {
    cookies.push({
      ...cookie,
      expires: cookie.expires
        ? Math.round(cookie.expires.getTime() / 1000)
        : undefined,
    });
  }
  if (cookies.length > 0) await page.setCookie(...cookies);

  const headers = {};
  res.headers.forEach((value, name) => {
    if (name !== "set-cookie") {
      headers[name] = value;
    }
  });

  const contentType = headers["content-type"];
  let body: string | Buffer;
  if (
    String(contentType).indexOf("text/") === 0 ||
    String(contentType).includes("; charset=")
  ) {
    body = await res.text();
    headers["content-length"] = String(body.length);
  } else {
    body = await res.buffer();
    headers["content-length"] = String(body.byteLength);
  }

  return { status: res.status, headers, contentType, body };
};
