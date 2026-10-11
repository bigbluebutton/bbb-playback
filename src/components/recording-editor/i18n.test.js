import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { createIntl, IntlProvider } from 'react-intl';
import { EditorLanguageProvider, LANGUAGE_KEY, catalogs, initialLocale, supportedLocale, translateDiagnostic, useEditorI18n } from './i18n';
import diagnostics from './locales/diagnostics.en.json';

beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/'); });
afterEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/'); });

test('language priority is URL, saved preference, browser/playback language, English fallback', () => {
  expect(initialLocale('ja-JP')).toBe('ja');
  expect(initialLocale('fr-FR')).toBe('en');
  expect(supportedLocale('ja_JP')).toBe('ja');
  expect(supportedLocale('JA')).toBe('ja');
  localStorage.setItem(LANGUAGE_KEY, 'en');
  expect(initialLocale('ja')).toBe('en');
  window.history.replaceState(null, '', '/?locale=ja-JP');
  expect(initialLocale('en')).toBe('ja');
  window.history.replaceState(null, '', '/');
  localStorage.setItem(LANGUAGE_KEY, 'unsupported');
  expect(initialLocale('ja')).toBe('ja');
});

test('storage restrictions do not prevent choosing or using a language', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
  expect(initialLocale('ja')).toBe('ja');
  jest.restoreAllMocks();
});

test('English and Japanese catalogs cover the same UI messages', () => {
  expect(Object.keys(catalogs.en).sort()).toEqual(Object.keys(catalogs.ja).sort());
  expect(Object.values(catalogs.en).every(text => text.length > 0)).toBe(true);
  for (const [locale, messages] of Object.entries(catalogs)) {
    const onError = jest.fn();
    const intl = createIntl({ locale, messages, onError });
    for (const id of Object.keys(messages)) {
      intl.formatMessage({ id }, { count: 2, record: 1, beep: 0, label: 'Test', number: 1,
        time: '00:01', meeting: '14:11', recorded: '03:49', backup: '/tmp/events.xml', file: 'test.webm', page: 3 });
    }
    expect(onError).not.toHaveBeenCalled();
  }
});

test('diagnostics retain dynamic details and translate nested causes', () => {
  for (const [source, translation] of Object.entries(diagnostics)) {
    expect(translateDiagnostic(source, 'ja')).toBe(source);
    expect(translateDiagnostic(source, 'en')).toBe(translation);
  }
  expect(translateDiagnostic('rawデータを読み込めません: events.xmlを読み込めません: invalid token', 'en'))
    .toBe('Cannot read raw data: Cannot read events.xml: invalid token');
  expect(translateDiagnostic('素材がありません: 会議の音声.webm', 'en')).toBe('Media is missing: 会議の音声.webm');
  expect(translateDiagnostic('音声加工 2/12', 'en')).toBe('Processing audio 2/12');
  expect(translateDiagnostic('ffmpeg: invalid input', 'en')).toBe('ffmpeg: invalid input');
});

test('a saved language is restored and overrides playback locale without changing its provider', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem(LANGUAGE_KEY, 'en');
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  function Probe() { const { t } = useEditorI18n(); return <span>{t('title')}</span>; }
  try {
    await act(async () => { root.render(<IntlProvider locale="ja" messages={{}}><EditorLanguageProvider><Probe /></EditorLanguageProvider></IntlProvider>); });
    expect(container.textContent).toBe('Recording editor');
    expect(document.documentElement.lang).toBe('en');
  } finally {
    await act(async () => root.unmount()); container.remove();
  }
});

test('switching language works without storage and keeps an explicit locale URL in sync', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, '', '/?editor=1&locale=ja-JP');
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled'); });
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  function Probe() {
    const { locale, setLocale, t } = useEditorI18n();
    return <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')}>{t('title')}</button>;
  }
  try {
    await act(async () => { root.render(<IntlProvider locale="ja" messages={{}}><EditorLanguageProvider><Probe /></EditorLanguageProvider></IntlProvider>); });
    await act(async () => { Simulate.click(container.querySelector('button')); });
    expect(container.textContent).toBe('Recording editor');
    expect(new URLSearchParams(window.location.search).get('locale')).toBe('en');
    expect(new URLSearchParams(window.location.search).get('editor')).toBe('1');
  } finally {
    await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks();
  }
});
