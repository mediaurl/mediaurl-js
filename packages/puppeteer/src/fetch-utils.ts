import { ActionHandlerContext } from "@mediaurl/sdk";
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
  const rawHeaders = res.headers.raw();

  const parsedCookies = setCookieParser.parse(
    setCookieParser.splitCookiesString(rawHeaders["set-cookie"]),
    { decodeValues: true }
  );
  if (parsedCookies.length > 0) {
    const cookies: any[] = [];
    for (const cookie of parsedCookies) {
      cookies.push({
        ...cookie,
        expires:
          cookie.expires && cookie.expires.getTime()
            ? cookie.expires.getTime() / 1000
            : cookie.maxAge
            ? Date.now() / 1000 + cookie.maxAge
            : -1,
        domain: cookie.domain || "." + new URL(res.url).hostname,
      });
    }
    await page.setCookie(...cookies);
  }

  const headers: Record<string, string> = {};
  for (const key of Object.keys(rawHeaders)) {
    const value = rawHeaders[key];
    if (Array.isArray(value)) headers[key] = value.join("\n");
    else if (value) headers[key] = value;
  }

  return {
    status: res.status,
    headers,
    contentType: headers["content-type"],
    body: await res.buffer(),
  };
};
