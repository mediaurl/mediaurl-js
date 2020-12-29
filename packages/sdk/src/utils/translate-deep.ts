import { TranslatedText } from "@mediaurl/schema";

const nextPath = (path: string, sub: string | number) => {
  if (path) path += ".";
  return (path += sub);
};

type TFunction = (
  key: string,
  defaultValue?: string
) => string | TranslatedText;

/**
 * Utility function to translate strings within an object or array.
 * The `t` function is called when a string starting with `triggerPrefix`
 * is found.
 * ```
 * {
 *   some: "Normal value",
 *   another: "i18n:Default translation value",
 *   anArray: [
 *     {
 *       anObjectInsideArray: "i18n:This text will also be translated"
 *     }
 *   ]
 * }
 * ```
 */
export const translateDeep = (
  object: any,
  t: TFunction,
  path = "",
  triggerPrefix = "i18n:"
) => {
  if (typeof object === "string") {
    if (object.indexOf(triggerPrefix) === 0) {
      object = object.substring(triggerPrefix.length);
      object = t(path, object);
    }
    return object;
  } else if (typeof object === "object") {
    if (Array.isArray(object)) {
      return object.map((value, index) =>
        translateDeep(value, t, nextPath(path, index), triggerPrefix)
      );
    }
    const n = {};
    for (const key in object) {
      n[key] = translateDeep(
        object[key],
        t,
        nextPath(path, key),
        triggerPrefix
      );
    }
    return n;
  } else {
    return object;
  }
};
