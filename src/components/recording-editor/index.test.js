import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { IntlProvider } from 'react-intl';
import RecordingEditor from './index';
import { LANGUAGE_KEY } from './i18n';
import useAudioPreview from './useAudioPreview';

jest.mock('./SlidePreview', () => () => <div>slide preview</div>);
jest.mock('./VideoPreview', () => () => <div>video preview</div>);
jest.mock('./useAudioPreview', () => jest.fn());
jest.mock('components/external-video-player', () => () => <div>external preview</div>);

const id = `${'a'.repeat(40)}-1700000000000`;
const manifest = {
  id, name: '編集テスト', revision: 'revision-one', duration_ms: 60000,
  record_ranges: [{ start_ms: 1000, end_ms: 59000 }], beep_ranges: [], record_ranges_persisted: true,
  events: [], assets: [], slides: [], warnings: [], published_url: '/playback/test',
  rebuild: { available: true, status: 'not_requested' },
  reset: { available: true },
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
    else if (url.endsWith('/rebuild')) result = { status: 'done', result: { available: true, status: 'requested' } };
    else if (url.endsWith('/save')) result = { status: 'done', result: { xml_backup: '/backup/events.xml' } };
    else if (url.endsWith('/reset')) result = { status: 'done', result: { archive: '/history/reset' } };
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

test('reopening restores saved beep intervals and enables edited audio preview', async () => {
  const beeps = [{ start_ms: 6500, end_ms: 9500 }];
  const checkbox = container.querySelector('.re-transport input[type="checkbox"]');
  await act(async () => { Simulate.change(checkbox, { target: { checked: false } }); });
  global.fetch.mockImplementation(async url => ({ ok: true, json: async () => url.endsWith('/preview')
    ? { status: 'done', result: { audio_url: '/demo.webm', peaks: [] } } : { ...manifest, beep_ranges: beeps } }));
  await act(async () => { Simulate.click(container.querySelector('.re-meeting')); });
  expect(container.querySelector('[aria-label="ピー音で置き換える区間1 開始"]').value).toBe('00:00:06.500');
  expect(container.querySelector('.re-transport input[type="checkbox"]').checked).toBe(true);
  expect(useAudioPreview).toHaveBeenLastCalledWith(expect.anything(), beeps, true);
});

test('reset requires confirmation and clears edits, draft and undo without rebuilding', async () => {
  await click('ピー音を追加');
  await click('初期状態に戻す…');
  expect(calls.some(call => call.url.endsWith('/reset'))).toBe(false);
  expect(container.querySelector('.re-reset-review').textContent).toContain('履歴へ退避');
  await click('確認して初期状態に戻す');
  expect(calls.find(call => call.url.endsWith('/reset')).payload).toEqual({ revision: 'revision-one', confirmed: true });
  expect(container.querySelector('[aria-label="ピー音で置き換える区間1 開始"]')).toBeNull();
  expect(button('↶ 元に戻す').disabled).toBe(true);
  expect(container.textContent).toContain('初期状態をrawに復元しました');
  expect(button('rawへ保存…').disabled).toBe(true);
  expect(button('録画を再構築…').disabled).toBe(false);
  expect(calls.filter(call => call.url.endsWith('/preview'))).toHaveLength(2);
  expect(calls.some(call => call.url.endsWith('/rebuild'))).toBe(false);
});

test('reset with an unavailable helper explains setup without requiring another raw save', async () => {
  const fetch = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url, options) => url.endsWith(`/${id}`)
    ? { ok: true, json: async () => ({ ...manifest, last_operation: 'reset', playback_sync: 'needs_rebuild', rebuild: { available: false, status: 'not_requested' } }) }
    : fetch(url, options));
  await click('初期状態に戻す…');
  await click('確認して初期状態に戻す');
  expect(button('rawへ保存…').disabled).toBe(true);
  expect(button('録画を再構築…').disabled).toBe(true);
  expect(container.textContent).toContain('rawへの再保存は不要');
  expect(container.querySelector('#re-rebuild-reason').textContent).toContain('rawへの保存や初期化とは別の条件');
  expect(calls.some(call => call.url.endsWith('/save'))).toBe(false);
});

test('unmarked original offers saving candidate intervals before rebuild', async () => {
  const fetch = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url, options) => url.endsWith(`/${id}`)
    ? { ok: true, json: async () => ({ ...manifest, record_ranges_persisted: false, last_operation: 'reset', playback_sync: 'needs_rebuild' }) }
    : fetch(url, options));
  await click('初期状態に戻す…');
  await click('確認して初期状態に戻す');
  expect(button('rawへ保存…').disabled).toBe(false);
  expect(button('録画を再構築…').disabled).toBe(true);
  expect(container.querySelector('#re-rebuild-reason').textContent).toContain('編集候補');
  expect(container.textContent).not.toContain('現在の編集内容はrawに保存済み');
  await click('rawへ保存…');
  await click('バックアップを作成して保存');
  expect(calls.some(call => call.url.endsWith('/save'))).toBe(true);
});

test('BBB processing blocks mutations and explains the disabled rebuild', async () => {
  const fetch = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url, options) => url.endsWith(`/${id}`)
    ? { ok: true, json: async () => ({ ...manifest, rebuild: { available: true, status: 'not_requested', processing: true } }) }
    : fetch(url, options));
  await act(async () => { Simulate.click(container.querySelector('.re-meeting')); });
  await click('ピー音を追加');
  expect(button('rawへ保存…').disabled).toBe(true);
  expect(button('録画を再構築…').disabled).toBe(true);
  expect(button('初期状態に戻す…').disabled).toBe(true);
  expect(container.querySelector('#re-rebuild-reason').textContent).toContain('処理中');
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
  await click('ピー音を追加');
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
  await click('Add beep');
  await click('Save to raw…');
  expect(container.querySelector('.re-review').textContent).toContain('Keep: 1 interval / Beep: 1 interval');
  global.fetch.mockImplementation(async () => ({ ok: false, json: async () => ({ error: 'events.xmlが変更されています。会議を読み直してください。' }) }));
  await click('Back up and save');
  expect(container.querySelector('[role="alert"]').textContent).toBe('events.xml has changed. Reload the meeting.');
  await language('ja');
  expect(container.querySelector('[role="alert"]').textContent).toBe('events.xmlが変更されています。会議を読み直してください。');
});


test('raw review explains audio file changes before sending a save request', async () => {
  await click('ピー音を追加');
  await click('rawへ保存…');
  const review = container.querySelector('.re-review');
  expect(review.textContent).toContain('raw内に別名ファイルを追加してXMLの参照先を切り替えます');
  expect(review.textContent).toContain('元ファイルとバックアップは保持します');
  expect(calls.some(call => call.url.endsWith('/save'))).toBe(false);
  await language('en');
  expect(review.textContent).toContain('All microphone audio and screen-sharing audio');
  expect(review.textContent).toContain('Original files and backups are retained');
});

test('rebuild requires saved edits and a separate confirmation, then reports a request not completion', async () => {
  await click('ピー音を追加');
  expect(button('録画を再構築…').disabled).toBe(true);
  await click('↶ 元に戻す');
  await click('録画を再構築…');
  expect(calls.some(call => call.url.endsWith('/rebuild'))).toBe(false);
  const review = container.querySelector('.re-rebuild-review');
  expect(review.textContent).toContain('削除され、作り直されます');
  expect(review.textContent).toContain('非公開状態の維持は保証されません');
  await language('en');
  expect(review.textContent).toContain('Unsaved edits and drafts are not included');
  await click('Confirm and request rebuild');
  const rebuild = calls.find(call => call.url.endsWith('/rebuild'));
  expect(rebuild.payload).toEqual({ revision: 'revision-one', confirmed: true });
  expect(rebuild.headers['X-BBB-Editor']).toBe('1');
  expect(container.textContent).toContain('It is not complete yet');
  expect(button('Rebuild recording…').disabled).toBe(true);
  expect(button('Save to raw…').disabled).toBe(true);
  expect(calls.some(call => call.url.endsWith('/save'))).toBe(false);
});

test('rebuild helper absence is visible and prevents submitting a request', async () => {
  global.fetch.mockImplementation(async url => ({ ok: true, json: async () => url.endsWith('/preview')
    ? { status: 'done', result: { audio_url: '/demo.webm', peaks: [] } }
    : { ...manifest, rebuild: { available: false, status: 'not_requested' } } }));
  await act(async () => { Simulate.click(container.querySelector('.re-meeting')); });
  expect(button('録画を再構築…').disabled).toBe(true);
  expect(container.querySelector('#re-rebuild-reason').textContent).toContain('未設置');
  expect(container.querySelector('#re-rebuild-reason code').textContent).toBe('sudo bash editor/deploy/install-rebuild-helper.sh');
});

test('polling a completed rebuild updates the message and unlocks raw saving', async () => {
  jest.useFakeTimers();
  try {
    await click('録画を再構築…');
    await click('確認して再構築を依頼');
    const originalMock = global.fetch.getMockImplementation();
    global.fetch.mockImplementation(async (url, options) => !options?.method && url.endsWith('/rebuild')
      ? { ok: true, json: async () => ({ available: true, status: 'completed' }) }
      : originalMock(url, options));
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(container.querySelector('.re-success').textContent).toContain('録画の再構築が完了しました');
    expect(button('rawへ保存…').disabled).toBe(true);
    expect(button('録画を再構築…').disabled).toBe(false);
    await click('ピー音を追加');
    expect(button('rawへ保存…').disabled).toBe(false);
  } finally { jest.useRealTimers(); }
});
