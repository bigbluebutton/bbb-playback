import React, { useState } from 'react';
import { formatTime } from './model';

const publicationLabels = {
  published: '公開', unpublished: '非公開', not_generated: '未生成', processing: '処理中', unknown: '不明',
};
const recordingLabels = { marked: '録画区間あり', unmarked: '録画区間なし', unknown: '区間不明' };
const filters = [
  ['all', 'すべて'], ['published', '公開'], ['unpublished', '非公開'],
  ['not_generated', '未生成'], ['processing', '処理中'], ['unmarked', '録画区間なし'],
  ['raw_missing', 'rawなし'], ['unknown', '状態不明'],
];
const matches = (meeting, filter) => {
  if (filter === 'all') return true;
  if (filter === 'unmarked') return meeting.recording_status === 'unmarked';
  if (filter === 'raw_missing') return meeting.raw_available === false;
  return (meeting.publication_status || 'unknown') === filter;
};
const durationText = ms => {
  if (!Number.isFinite(ms)) return '—';
  const text = formatTime(ms).slice(0, 8);
  return ms < 3600000 ? text.slice(3) : text;
};

export default function MeetingList({ meetings, selectedId, busy, dirty, onRefresh, onOpen }) {
  const [filter, setFilter] = useState('all');
  const visible = meetings.filter(meeting => matches(meeting, filter));
  const selectedHidden = selectedId && !visible.some(meeting => meeting.id === selectedId);
  return <aside className="re-meetings">
    <div className="re-sidebar-title"><h2>最近の会議</h2><button disabled={!!busy} onClick={onRefresh} title="一覧を更新">↻</button></div>
    <p className="re-muted">過去14日 · rawがない会議は警告</p>
    <label className="re-meeting-filter">表示
      <select aria-label="会議の絞り込み" value={filter} disabled={!!busy} onChange={event => setFilter(event.target.value)}>
        {filters.map(([value, label]) => <option key={value} value={value}>{label} ({meetings.filter(meeting => matches(meeting, value)).length})</option>)}
      </select>
    </label>
    {visible.map(meeting => {
      const publication = publicationLabels[meeting.publication_status] ? meeting.publication_status : 'unknown';
      const recording = recordingLabels[meeting.recording_status] ? meeting.recording_status : 'unknown';
      return <button className={`re-meeting ${selectedId === meeting.id ? 'active' : ''}`} key={meeting.id} disabled={!!busy} onClick={() => onOpen(meeting.id)}>
        <strong>{meeting.name || meeting.id.slice(0, 8)}</strong>
        <span>{new Date(meeting.date || Number(meeting.id.split('-')[1])).toLocaleString('ja-JP')}</span>
        <span>会議 {durationText(meeting.duration_ms)} · 録画区間 {durationText(meeting.recorded_duration_ms)}</span>
        <span className="re-meeting-status">
          <span className={`re-status re-status-${recording}`}>{recordingLabels[recording]}</span>
          <span className={`re-status re-status-${publication}`}>{publicationLabels[publication]}</span>
          {meeting.raw_available === false && <span className="re-status re-status-missing">rawなし</span>}
        </span>
        {meeting.warnings?.length > 0 && <small className="re-meeting-warning">{meeting.warnings.join(' / ')}</small>}
      </button>;
    })}
    {!visible.length && <p className="re-muted">{meetings.length ? '条件に一致する会議がありません。' : '対象の会議がありません。'}</p>}
    {selectedHidden && <p className="re-muted">選択中の会議は絞り込み結果に含まれません。編集画面はそのまま表示しています。</p>}
    {dirty && <p className="re-muted">会議を切り替える前に下書きかrawへ保存してください。</p>}
  </aside>;
}
