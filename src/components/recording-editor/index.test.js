import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { IntlProvider } from 'react-intl';
import RecordingEditor from './index';
import { LANGUAGE_KEY } from './i18n';

jest.mock('./SlidePreview', () => () => <div>slide preview</div>);
jest.mock('./VideoPreview', () => () => <div>video preview</div>);
jest.mock('./useAudioPreview', () => () => {});
jest.mock('components/external-video-player', () => () => <div>external preview</div>);

const id = `${'a'.repeat(40)}-1700000000000`;
const manifest = {
  id, name: '編集テスト', revision: 'revision-one', duration_ms: 60000,
  record_ranges: [{ start_ms: 1000, end_ms: 59000 }], beep_ranges: [],
  events: [], assets: [], slides: [], warnings: [], published_url: '/playback/test',
};
let container;
let root;
let calls;
const originalFetch = global.fetch;
const button = text => [...container.querySelectorAll('button')].find(b => b.textContent === text);
async function click(text) { await act(async () => { Simulate.click(button(text)); }); }
async function time(label, text) {
  const input = container.querySelector(`input[aria-label="${label}"]`);
  await act(async () => { Simulate.change(input, { target: { value: text } }); });
  await act(async () => { Simulate.blur(input); });
}
async function language(value) {
  await act(async () => { Simulate.change(container.querySelector('.re-language select'), { target: { value } }); });
}

beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.removeItem(LANGUAGE_KEY);
  calls = [];
  global.fetch = jest.fn(async (url, options) => {
    const payload = options?.body ? JSON.parse(options.body) : null;
    calls.push({ url, payload, headers: options?.headers });
    let result;
    if (url.endsWith('/recordings')) result = [{ id, name: manifest.name, date: '2026-10-10T08:00:00Z', duration_ms: 60000,
      recorded_duration_ms: 58000, recording_status: 'marked', publication_status: 'unpublished', raw_available: true, warnings: [] }];
    else if (url.endsWith('/preview')) result = { status: 'done', result: { audio_url: '/demo.webm', peaks: [0.1, 0.5] } };
    else if (url.endsWith('/draft')) result = payload;
    else if (url.endsWith('/save')) result = { status: 'done', result: { xml_backup: '/backup/events.xml' } };
    else result = manifest;
    return { ok: true, json: async () => result };
  });
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  await act(async () => { root.render(<IntlProvider locale="ja" messages={{}}><RecordingEditor /></IntlProvider>); });
  await act(async () => { Simulate.click(container.querySelector('.re-meeting')); });
});

afterEach(async () => { await act(async () => root.unmount()); container.remove(); localStorage.removeItem(LANGUAGE_KEY); jest.restoreAllMocks(); global.fetch = originalFetch; });

test('editing, undo/redo and draft send meeting-time ranges with revision', async () => {
  await time('選択開始', '00:00:06.500');
  await time('選択終了', '00:00:09.500');
  await click('ピー音を追加');
  expect(container.querySelector('[aria-label="ピー音で置き換える区間1 開始"]').value).toBe('00:00:06.500');
  await click('↶ 元に戻す');
  expect(container.querySelector('[aria-label="ピー音で置き換える区間1 開始"]')).toBeNull();
  await click('↷ やり直す');
  await click('下書きを保存');
  const draft = calls.find(c => c.url.endsWith('/draft'));
  expect(draft.payload).toMatchObject({ revision: 'revision-one', beep_ranges: [{ start_ms: 6500, end_ms: 9500 }] });
  expect(draft.headers['X-BBB-Editor']).toBe('1');
  expect(calls.some(c => c.url.endsWith('/save'))).toBe(false);
});

test('record-off splits the range and bad time input cannot edit it', async () => {
  await time('選択開始', '00:00:06.500');
  await time('選択終了', '00:00:09.500');
  await click('録画から除外');
  await time('録画に残す区間1 開始', '00:61:00');
  expect(container.querySelector('[aria-label="録画に残す区間1 開始"]').classList.contains('invalid')).toBe(true);
  await click('下書きを保存');
  expect(calls.find(c => c.url.endsWith('/draft')).payload.record_ranges).toEqual([
    { start_ms: 1000, end_ms: 6500 }, { start_ms: 9500, end_ms: 59000 },
  ]);
});

test('saving refreshes meeting summaries and keeps the current publication badge', async () => {
  await click('rawへ保存…');
  await click('バックアップを作成して保存');
  expect(calls.filter(call => call.url.endsWith('/recordings'))).toHaveLength(2);
  expect(container.querySelector('.re-meeting .re-status-unpublished').textContent).toBe('非公開');
  expect(container.textContent).toContain('XMLバックアップ: /backup/events.xml');
});

test('switching language preserves edits, selection, filter, undo history and media', async () => {
  await time('選択開始', '00:00:06.500');
  await time('選択終了', '00:00:09.500');
  await click('ピー音を追加');
  await act(async () => { Simulate.change(container.querySelector('[aria-label="会議の絞り込み"]'), { target: { value: 'unpublished' } }); });
  const requests = calls.length;
  const audio = container.querySelector('audio');
  await language('en');
  expect(container.querySelector('.re-brand').textContent).toBe('BigBlueButton');
  expect(document.title).toBe('BigBlueButton · Recording editor');
  expect(document.documentElement.lang).toBe('en');
  expect(container.querySelector('.re-header strong').textContent).toBe('Recording editor');
  expect(container.querySelector('[aria-label="Selection start"]').value).toBe('00:00:06.500');
  expect(container.querySelector('[aria-label="Intervals to replace with beeps 1 start"]').value).toBe('00:00:06.500');
  expect(container.querySelector('[aria-label="Filter meetings"]').value).toBe('unpublished');
  expect(container.querySelector('.re-status-unpublished').textContent).toBe('Unpublished');
  expect(container.querySelector('.re-dirty').textContent).toBe('Unsaved changes');
  expect(container.querySelector('audio')).toBe(audio);
  expect(calls).toHaveLength(requests);
  expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
  await click('↶ Undo');
  expect(container.querySelector('[aria-label="Intervals to replace with beeps 1 start"]')).toBeNull();
  await click('↷ Redo');
  await click('Save draft');
  expect(container.textContent).toContain('Draft saved. Raw data has not been changed.');
  expect(calls.find(c => c.url.endsWith('/draft')).payload.beep_ranges).toEqual([{ start_ms: 6500, end_ms: 9500 }]);
  await language('ja');
  expect(container.textContent).toContain('下書きを保存しました。rawデータは変更していません。');
  expect(container.querySelector('[aria-label="ピー音で置き換える区間1 開始"]').value).toBe('00:00:06.500');
});

test('warnings, save review, errors and completed messages follow the selected language', async () => {
  const warned = { ...manifest, warnings: ['rawデータがありません。'],
    events: [{ type: 'PublicChatEvent', time_ms: 0, name: '参加者', message: 'rawデータがありません。' }] };
  global.fetch.mockImplementation(async url => ({ ok: true, json: async () => url.endsWith('/preview')
    ? { status: 'done', result: { audio_url: '/demo.webm', peaks: [] } } : warned }));
  await act(async () => { Simulate.click(container.querySelector('.re-meeting')); });
  await language('en');
  expect(container.querySelector('.re-warnings').textContent).toContain('Raw data is missing.');
  // User content is kept exactly as recorded, even when it resembles a diagnostic.
  expect(container.querySelector('.re-events').textContent).toContain('参加者: rawデータがありません。');
  await click('Save to raw…');
  expect(container.querySelector('.re-review').textContent).toContain('Keep: 1 interval / Beep: 0 intervals');
  global.fetch.mockImplementation(async () => ({ ok: false, json: async () => ({ error: 'events.xmlが変更されています。会議を読み直してください。' }) }));
  await click('Back up and save');
  expect(container.querySelector('[role="alert"]').textContent).toBe('events.xml has changed. Reload the meeting.');
  await language('ja');
  expect(container.querySelector('[role="alert"]').textContent).toBe('events.xmlが変更されています。会議を読み直してください。');
});
