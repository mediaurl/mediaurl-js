import { TranslatedText } from "@watchedcom/sdk";
import i18next, { InitOptions, TFunction } from "i18next";
import FsBackend from "i18next-node-fs-backend";
import LocizeBackend from "i18next-node-locize-backend";
import path from "path";

export { i18next };

/**
 * Returns an `TFunction` instance.
 */
export const changeLanguage = async (lng: string): Promise<TFunction> =>
  await i18next.cloneInstance().changeLanguage(lng);

const tForAll = {};

/**
 * Initialize i18next with file system backend, or when `LOCIZE_PROJECTID` is set,
 * with the locize backend.
 */
export const init = async (languages: string[], options?: InitOptions) => {
  if (process.env.LOCIZE_PROJECTID) {
    i18next.use(
      new LocizeBackend({
        projectId: <string>process.env.LOCIZE_PROJECTID,
        apiKey: process.env.LOCIZE_API_KEY,
        version: process.env.LOCIZE_VERSION ?? "latest"
      })
    );
  } else {
    i18next.use(
      new FsBackend(null, {
        loadPath: path.join("locales", "{{lng}}", "{{ns}}.json"),
        addPath: path.join("locales", "{{lng}}", "{{ns}}.missing.json"),
        jsonIndent: 2
      })
    );
  }

  await i18next.init({
    debug: false,
    fallbackLng: languages[0],
    whitelist: languages,
    load: "languageOnly",
    saveMissing: true,
    updateMissing: true,
    ...options
  });

  for (const lng of languages) {
    if (lng !== "cimode") {
      tForAll[lng] = await changeLanguage(lng);
    }
  }
};

/**
 * Get translations in all languages for a specific key. This
 * can be used to set values of type `TranslatedText`.
 */
export const tAll = (key: string, defaultValue?: string) => {
  const res: TranslatedText = {};
  for (const lng of Object.keys(tForAll)) {
    res[lng] = tForAll[lng](key, defaultValue);
  }
  return res;
};
