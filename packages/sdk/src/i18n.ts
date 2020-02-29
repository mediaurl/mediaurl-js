import { I18nHandler } from "./interfaces";

export class DummyI18nHandler implements I18nHandler {
  getInstance(): I18nHandler {
    return this;
  }

  changeLanguage(language: string): void | Promise<void> {}

  t(key: string, defaultValue: string) {
    return defaultValue ?? key;
  }
}
