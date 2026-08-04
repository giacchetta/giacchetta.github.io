import en from './en.json';

type Dictionary = Record<string, string>;

const dictionary: Dictionary = en;

/** Returns a translator for the (single) English UI dictionary. */
export function useTranslations() {
  return function t(key: string): string {
    return dictionary[key] ?? key;
  };
}
