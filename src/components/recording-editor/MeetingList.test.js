import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import MeetingList from './MeetingList';
import { IntlProvider } from 'react-intl';

const meeting = (name, publication, recording = 'marked', raw = true) => ({
  id: `${name}-1700000000000`, name, date: '2026-10-10T08:00:00Z',
  duration_ms: 851185, recorded_duration_ms: recording === 'unmarked' ? 0 : 229257,
  publication_status: publication, recording_status: recording, raw_available: raw, warnings: [],
});
const meetings = [meeting('Public', 'published'), meeting('Private', 'unpublished'),
  meeting('No marks', 'not_generated', 'unmarked'), meeting('Working', 'processing'),
  { ...meeting('Missing raw', 'unpublished', 'unknown', false), recorded_duration_ms: null },
  meeting('Unknown', 'unknown')];
let container;
let root;
let onOpen;
let onRefresh;
const localized = component => <IntlProvider locale="ja" defaultLocale="ja" messages={{}}>{component}</IntlProvider>;
const rows = () => [...container.querySelectorAll('.re-meeting')];
async function filter(value) {
  await act(async () => { Simulate.change(container.querySelector('select'), { target: { value } }); });
}

beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  onOpen = jest.fn(); onRefresh = jest.fn();
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  await act(async () => { root.render(localized(<MeetingList meetings={meetings} selectedId={meetings[0].id} onOpen={onOpen} onRefresh={onRefresh} />)); });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

test('shows independent badges, meeting length, marked duration and missing raw', () => {
  expect(rows()).toHaveLength(6);
  expect(rows()[0].textContent).toContain('会議 14:11 · 録画区間 03:49');
  expect(rows()[0].querySelector('.re-status-published').textContent).toBe('公開');
  expect(rows()[2].textContent).toContain('録画区間 00:00');
  expect(rows()[2].querySelector('.re-status-unmarked').textContent).toBe('録画区間なし');
  expect(rows()[4].textContent).toContain('録画区間 —');
  expect(rows()[4].querySelector('.re-status-missing').textContent).toBe('rawなし');
});

test('all status filters include correct meetings and counts without changing selection', async () => {
  const expectations = { published: ['Public'], unpublished: ['Private', 'Missing raw'],
    not_generated: ['No marks'], processing: ['Working'], unmarked: ['No marks'],
    raw_missing: ['Missing raw'], unknown: ['Unknown'] };
  for (const [value, names] of Object.entries(expectations)) {
    await filter(value);
    expect(rows().map(row => row.querySelector('strong').textContent)).toEqual(names);
    const option = container.querySelector(`option[value="${value}"]`);
    expect(option.textContent).toContain(`(${names.length})`);
  }
  expect(onOpen).not.toHaveBeenCalled();
  expect(container.textContent).toContain('選択中の会議は絞り込み結果に含まれません');
  await filter('all');
  expect(rows()[0].classList.contains('active')).toBe(true);
});

test('opening meetings and refreshing still call the supplied actions', async () => {
  await act(async () => { Simulate.click(rows()[1]); });
  expect(onOpen).toHaveBeenCalledWith(meetings[1].id);
  await act(async () => { Simulate.click(container.querySelector('[title="一覧を更新"]')); });
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

test('new meeting data keeps the filter and gives a clear empty result', async () => {
  await filter('published');
  await act(async () => { root.render(localized(<MeetingList meetings={[meetings[1]]} selectedId={meetings[1].id} onOpen={onOpen} onRefresh={onRefresh} />)); });
  expect(container.querySelector('select').value).toBe('published');
  expect(rows()).toHaveLength(0);
  expect(container.textContent).toContain('条件に一致する会議がありません');
});

test('unknown metadata is not guessed to be published or unmarked', async () => {
  await act(async () => { root.render(localized(<MeetingList meetings={[{ id: 'fallback-1700000000000', warnings: ['Metadata unavailable'] }]} onOpen={onOpen} onRefresh={onRefresh} />)); });
  expect(rows()[0].textContent).toContain('会議 — · 録画区間 —');
  expect(rows()[0].querySelector('.re-status-unknown').textContent).toBe('区間不明');
  expect(rows()[0].textContent).toContain('Metadata unavailable');
  await filter('unmarked');
  expect(rows()).toHaveLength(0);
});
