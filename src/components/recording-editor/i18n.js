import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import playbackEn from 'locales/messages/en.json';
import playbackJa from 'locales/messages/ja.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import diagnostics from './locales/diagnostics.en.json';

export const LANGUAGE_KEY = 'bbb-recording-editor.language';
export const languages = [{ code: 'ja', label: '日本語' }, { code: 'en', label: 'English' }];
export const catalogs = { en, ja };
const LanguageContext = createContext(null);
export const supportedLocale = locale => /^ja(?:[-_]|$)/i.test(locale || '') ? 'ja' : 'en';

export function initialLocale(fallback = navigator.language) {
  const query = new URLSearchParams(window.location.search).get('locale');
  if (query) return supportedLocale(query);
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (catalogs[saved]) return saved;
  } catch { /* The selector still works when browser storage is unavailable. */ }
  return supportedLocale(fallback);
}

// Translate only diagnostics displayed by the editor. Meeting names, chat,
// filenames and the API's original messages are not rewritten.
export function translateDiagnostic(message, locale) {
  if (!message || supportedLocale(locale) === 'ja') return message;
  if (diagnostics[message]) return diagnostics[message];
  for (const [source, translation] of Object.entries(diagnostics)) {
    if (source.endsWith(': ') && message.startsWith(source)) {
      return translation + translateDiagnostic(message.slice(source.length), locale);
    }
  }
  const progress = message.match(/^音声加工 (\d+)\/(\d+)$/);
  return progress ? `Processing audio ${progress[1]}/${progress[2]}` : message;
}

export function useEditorI18n() {
  const intl = useIntl();
  const controls = useContext(LanguageContext);
  const locale = supportedLocale(intl.locale);
  const t = (id, values) => intl.formatMessage({ id: `recordingEditor.${id}`, defaultMessage: catalogs[locale][id] || en[id] }, values);
  const diagnostic = message => translateDiagnostic(message, locale);
  const message = value => typeof value === 'string' ? diagnostic(value) : value ? t(value.id, value.values) : '';
  return { intl, locale, t, diagnostic, message, setLocale: controls?.setLocale };
}

export function EditorLanguageProvider({ children }) {
  const parent = useIntl();
  const [locale, setLanguage] = useState(() => initialLocale(parent.locale));
  const setLocale = value => {
    if (!catalogs[value]) return;
    setLanguage(value);
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch { /* Optional persistence. */ }
    // Keep an explicit locale URL in sync so it does not undo a user's choice
    // on reload; no navigation and no remount of the active editor.
    const url = new URL(window.location.href);
    if (url.searchParams.has('locale')) {
      url.searchParams.set('locale', value);
      window.history.replaceState(window.history.state, '', url);
    }
  };
  const messages = useMemo(() => ({ ...playbackEn, ...(locale === 'ja' ? playbackJa : {}),
    ...Object.fromEntries(Object.entries(catalogs[locale]).map(([id, text]) => [`recordingEditor.${id}`, text])) }), [locale]);
  useEffect(() => {
    const html = document.documentElement;
    const previous = { lang: html.getAttribute('lang'), dir: html.getAttribute('dir'), title: document.title };
    html.setAttribute('lang', locale);
    html.setAttribute('dir', 'ltr');
    document.title = `BigBlueButton · ${catalogs[locale].title}`;
    return () => {
      ['lang', 'dir'].forEach(key => previous[key] === null ? html.removeAttribute(key) : html.setAttribute(key, previous[key]));
      document.title = previous.title;
    };
  }, [locale]);
  return <LanguageContext.Provider value={{ setLocale }}><IntlProvider locale={locale} messages={messages}>{children}</IntlProvider></LanguageContext.Provider>;
}

export function EditorLoading() {
  const parent = useIntl();
  return <p>{catalogs[initialLocale(parent.locale)].loadingApp}</p>;
}
