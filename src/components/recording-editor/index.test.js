import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { IntlProvider } from 'react-intl';
import RecordingEditor from './index';

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

beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  calls = [];
  global.fetch = jest.fn(async (url, options) => {
    const payload = options?.body ? JSON.parse(options.body) : null;
    calls.push({ url, payload, headers: options?.headers });
    let result;
    if (url.endsWith('/recordings')) result = [{ id, name: manifest.name, date: '2026-10-10T08:00:00Z', warnings: [] }];
    else if (url.endsWith('/preview')) result = { status: 'done', result: { audio_url: '/demo.webm', peaks: [0.1, 0.5] } };
    else if (url.endsWith('/draft')) result = payload;
    else result = manifest;
    return { ok: true, json: async () => result };
  });
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  await act(async () => { root.render(<IntlProvider locale="ja" messages={{}}><RecordingEditor /></IntlProvider>); });
  await act(async () => { Simulate.click(container.querySelector('.re-meeting')); });
});

afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); global.fetch = originalFetch; });

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
