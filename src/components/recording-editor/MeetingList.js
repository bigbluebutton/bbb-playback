import React, { useState } from 'react';
import { formatTime } from './model';
import { useEditorI18n } from './i18n';

const publicationLabels = {
  published: 'published', unpublished: 'unpublished', not_generated: 'not_generated', processing: 'processing', unknown: 'unknown',
};
const recordingLabels = { marked: 'marked', unmarked: 'unmarked', unknown: 'rangesUnknown' };
const filters = [
  ['all', 'all'], ['published', 'published'], ['unpublished', 'unpublished'],
  ['not_generated', 'not_generated'], ['processing', 'processing'], ['unmarked', 'unmarked'],
  ['raw_missing', 'rawMissing'], ['unknown', 'statusUnknown'],
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
  const { locale, t, diagnostic } = useEditorI18n();
  const [filter, setFilter] = useState('all');
  const visible = meetings.filter(meeting => matches(meeting, filter));
  const selectedHidden = selectedId && !visible.some(meeting => meeting.id === selectedId);
  return <aside className="re-meetings">
    <div className="re-sidebar-title"><h2>{t('recentMeetings')}</h2><button disabled={!!busy} onClick={onRefresh} title={t('refreshList')}>↻</button></div>
    <p className="re-muted">{t('recentHint')}</p>
    <label className="re-meeting-filter">{t('show')}
      <select aria-label={t('filter')} value={filter} disabled={!!busy} onChange={event => setFilter(event.target.value)}>
        {filters.map(([value, label]) => <option key={value} value={value}>{t(label)} ({meetings.filter(meeting => matches(meeting, value)).length})</option>)}
      </select>
    </label>
    {visible.map(meeting => {
      const publication = publicationLabels[meeting.publication_status] ? meeting.publication_status : 'unknown';
      const recording = recordingLabels[meeting.recording_status] ? meeting.recording_status : 'unknown';
      return <button className={`re-meeting ${selectedId === meeting.id ? 'active' : ''}`} key={meeting.id} disabled={!!busy} onClick={() => onOpen(meeting.id)}>
        <strong>{meeting.name || meeting.id.slice(0, 8)}</strong>
        <span>{new Date(meeting.date || Number(meeting.id.split('-')[1])).toLocaleString(locale)}</span>
        <span>{t('durations', { meeting: durationText(meeting.duration_ms), recorded: durationText(meeting.recorded_duration_ms) })}</span>
        <span className="re-meeting-status">
          <span className={`re-status re-status-${recording}`}>{t(recordingLabels[recording])}</span>
          <span className={`re-status re-status-${publication}`}>{t(publicationLabels[publication])}</span>
          {meeting.raw_available === false && <span className="re-status re-status-missing">{t('rawMissing')}</span>}
        </span>
        {meeting.warnings?.length > 0 && <small className="re-meeting-warning">{meeting.warnings.map(diagnostic).join(' / ')}</small>}
      </button>;
    })}
    {!visible.length && <p className="re-muted">{t(meetings.length ? 'noMatches' : 'noMeetings')}</p>}
    {selectedHidden && <p className="re-muted">{t('selectionHidden')}</p>}
    {dirty && <p className="re-muted">{t('saveBeforeSwitch')}</p>}
  </aside>;
}
