import en from './en.json';

type Dictionary = Record<string, string>;

const dictionaries: Record<string, Dictionary> = { en };

// Load generated locale files if they exist
const localeModules = import.meta.glob<{ default: Dictionary }>('./*.json', { eager: true });
for (const [path, mod] of Object.entries(localeModules)) {
  const match = path.match(/\.\/(.+)\.json$/);
  if (match && match[1] !== 'en') {
    dictionaries[match[1]] = mod.default;
  }
}

export function useTranslations(locale: string | undefined) {
  const lang = locale ?? 'en';
  const dict = dictionaries[lang] ?? dictionaries['en'];
  return function t(key: string): string {
    return dict[key] ?? dictionaries['en'][key] ?? key;
  };
}

export function localePath(path: string, locale: string | undefined): string {
  const l = locale ?? 'en';
  if (l === 'en') return path;
  return `/${l}${path}`;
}

export function getLocaleForDate(locale: string | undefined): string {
  const map: Record<string, string> = {
    'en': 'en-US',
    'es-ar': 'es-AR',
    'es-uy': 'es-UY',
  };
  return map[locale ?? 'en'] ?? 'en-US';
}

export const locales = [
  { code: 'en', label: 'EN' },
  { code: 'es-ar', label: 'ES-AR' },
  { code: 'es-uy', label: 'ES-UY' },
] as const;
