import { TranslatedText } from "@mediaurl/sdk";
import i18next, { InitOptions, TFunction } from "i18next";
import FsBackend from "i18next-fs-backend";
import LocizeBackend from "i18next-locize-backend";
import path from "path";

let availableLanguages: string[] = [];

/**
 * Initialize i18next with file system backend, or when `LOCIZE_PROJECTID` is set,
 * with the locize backend.
 */
export const init = async (languages: string[], options?: InitOptions) => {
  availableLanguages = languages;

  let backend: any;
  if (process.env.LOCIZE_PROJECTID) {
    i18next.use(LocizeBackend);
    backend = {
      projectId: <string>process.env.LOCIZE_PROJECTID,
      apiKey: process.env.LOCIZE_API_KEY,
      version: process.env.LOCIZE_VERSION ?? "latest",
    };
  } else {
    i18next.use(FsBackend);
    backend = {
      loadPath: path.join("locales", "{{lng}}", "{{ns}}.json"),
      addPath: path.join("locales", "{{lng}}", "{{ns}}.missing.json"),
      jsonIndent: 2,
    };
  }

  await i18next.init({
    backend,
    debug: false,
    fallbackLng: languages[0],
    whitelist: languages,
    preload: languages,
    load: "languageOnly",
    saveMissing: process.env.NODE_ENV !== "production",
    updateMissing: process.env.NODE_ENV !== "production",
    ...options,
  });
};

export const i18n = i18next;

/**
 * Returns an `TFunction` instance.
 */
export const getFixedT = (lng: string | string[], ns?: string | string[]) =>
  i18next.getFixedT(lng, ns);

/**
 * Returns an `TFunction` instance.
 * Deprecated. I18n.getFixedT should be used for example.
 */
export const changeLanguage = async (lng: string): Promise<TFunction> =>
  getFixedT(lng);

/**
 * Get translations in all languages for a specific key. This
 * can be used to set values of type `TranslatedText`.
 */
export const tAll = (key: string, defaultValue?: string) => {
  const res: TranslatedText = {};
  for (const lng of availableLanguages) {
    const t = getFixedT(lng);
    res[lng] = t(key, defaultValue);
  }
  return res;
};
