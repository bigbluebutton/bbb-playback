import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorLanguageProvider, languages, useEditorI18n } from './i18n';
import ExternalVideoPlayer from 'components/external-video-player';
import SlidePreview from './SlidePreview';
import VideoPreview from './VideoPreview';
import MeetingList from './MeetingList';
import useAudioPreview from './useAudioPreview';
import { audioAdapter, externalVideos, formatTime, normalizeRanges, parseTime, removeRange } from './model';
import './styles.css';

const PREFIX = process.env.REACT_APP_EDITOR_PREFIX || '/recording-editor';
const API = `${PREFIX}/api`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(path, data) {
  const response = await fetch(`${API}${path}`, data === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BBB-Editor': '1' }, body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

function TimeField({ value, onChange, label, max, onFocus }) {
  const { t } = useEditorI18n();
  const [text, setText] = useState(formatTime(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setText(formatTime(value)); setInvalid(false); }, [value]);
  const commit = () => {
    const parsed = parseTime(text);
    if (parsed === null || parsed > max || onChange(parsed) === false) { setInvalid(true); return; }
    setText(formatTime(parsed)); setInvalid(false);
  };
  return <input className={invalid ? 're-time invalid' : 're-time'} aria-label={label} title={invalid ? t('invalidTime') : t('timeFormat')}
    value={text} onFocus={onFocus} onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

function RangeRows({ label, ranges, onChange, duration, seek }) {
  const { t } = useEditorI18n();
  return <div className="re-range-list"><h3>{label} <small>{t('rangeCount', { count: ranges.length })}</small></h3>
    {!ranges.length && <p className="re-muted">{t('noRanges')}</p>}
    {ranges.map((r, i) => <div className="re-range-row" key={i}>
      <button title={t('seekStart')} onClick={() => seek(r.start_ms)}>{i + 1}</button>
      <TimeField label={t('rangeStart', { label, number: i + 1 })} value={r.start_ms} max={duration} onChange={v => {
        if (v >= r.end_ms) return false;
        onChange(ranges.map((item, index) => index === i ? { ...item, start_ms: v } : item)); return true;
      }} />
      <span>–</span>
      <TimeField label={t('rangeEnd', { label, number: i + 1 })} value={r.end_ms} max={duration} onChange={v => {
        if (v <= r.start_ms) return false;
        onChange(ranges.map((item, index) => index === i ? { ...item, end_ms: v } : item)); return true;
      }} />
      <button title={t('deleteRange')} aria-label={t('rangeDelete', { label, number: i + 1 })} onClick={() => onChange(ranges.filter((_, index) => index !== i))}>×</button>
    </div>)}
  </div>;
}

function Timeline({ recording, edit, change, selection, setSelection, time, seek, peaks, zoom }) {
  const { t } = useEditorI18n();
  const ref = useRef(null);
  const duration = recording.duration_ms || 1;
  const pct = ms => `${ms / duration * 100}%`;
  const position = e => {
    const bounds = ref.current.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(duration, (e.clientX - bounds.left) / bounds.width * duration)));
  };
  const select = e => {
    if (e.button !== 0) return;
    const start = position(e);
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setSelection({ start_ms: start, end_ms: start });
    const move = next => { const end = position(next); setSelection({ start_ms: Math.min(start, end), end_ms: Math.max(start, end) }); };
    const up = next => { move(next); seek(position(next)); target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); };
    e.currentTarget.addEventListener('pointermove', move);
    e.currentTarget.addEventListener('pointerup', up, { once: true });
  };
  const handle = (e, kind, index, edge) => {
    e.stopPropagation(); e.preventDefault();
    const range = edit[kind][index];
    const move = next => {
      const value = position(next);
      const updated = { ...range, [edge]: edge === 'start_ms' ? Math.min(value, range.end_ms - 1) : Math.max(value, range.start_ms + 1) };
      setSelection(updated);
    };
    const up = next => {
      const value = position(next);
      const updated = { ...range, [edge]: edge === 'start_ms' ? Math.min(value, range.end_ms - 1) : Math.max(value, range.start_ms + 1) };
      change(kind, edit[kind].map((r, i) => i === index ? updated : r));
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  };
  const rangeTrack = (kind, label) => <div className={`re-track ${kind}`}><span className="re-track-label">{label}</span>
    {edit[kind].map((r, i) => <div className="re-bar" key={i} style={{ left: pct(r.start_ms), width: pct(r.end_ms - r.start_ms) }} onPointerDown={e => e.stopPropagation()} onClick={() => setSelection(r)} title={`${formatTime(r.start_ms)} – ${formatTime(r.end_ms)}`}>
      <button className="re-handle left" aria-label={t('dragStart', { label, number: i + 1 })} onPointerDown={e => handle(e, kind, i, 'start_ms')} />
      <span>{i + 1}</span>
      <button className="re-handle right" aria-label={t('dragEnd', { label, number: i + 1 })} onPointerDown={e => handle(e, kind, i, 'end_ms')} />
    </div>)}
  </div>;
  return <div className="re-timeline-scroll"><div className="re-timeline" ref={ref} style={{ width: `${zoom * 100}%` }} onPointerDown={select}>
    <div className="re-ruler">{Array.from({ length: 11 }, (_, i) => <span key={i} style={{ left: `${i * 10}%` }}>{formatTime(duration * i / 10).slice(0, 8)}</span>)}</div>
    <div className="re-wave"><span className="re-track-label">{t('meetingAudio')}</span><svg viewBox="0 0 2048 64" preserveAspectRatio="none" aria-label={t('waveform')}>
      {(peaks || []).map((p, i) => <line key={i} x1={i} x2={i} y1={32 - Math.min(1, p) * 30} y2={32 + Math.min(1, p) * 30} />)}
    </svg>{!peaks && <span className="re-wave-pending">{t('wavePending')}</span>}</div>
    {rangeTrack('record_ranges', t('keep'))}{rangeTrack('beep_ranges', t('beep'))}
    {['video', 'deskshare'].map(kind => <div className={`re-track ${kind}`} key={kind}><span className="re-track-label">{kind === 'video' ? t('camera') : t('screen')}</span>
      {recording.assets.filter(a => a.kind === kind).map(a => <div key={a.id} className={`re-clip ${a.error ? 'missing' : ''}`} style={{ left: pct(a.start_ms), width: pct(a.end_ms - a.start_ms) }} title={`${a.relative || a.filename}\n${formatTime(a.start_ms)} – ${formatTime(a.end_ms)}`} onPointerDown={e => e.stopPropagation()} onClick={() => seek(a.start_ms)}>{a.user || kind}</div>)}
    </div>)}
    <div className="re-track re-slide-track"><span className="re-track-label">{t('slidesVideos')}</span>{recording.events.filter(e => ['SharePresentationEvent', 'GotoSlideEvent', 'StartExternalVideoRecordEvent'].includes(e.type)).map((e, i) => <button key={i} className="re-event-marker" style={{ left: pct(e.time_ms) }} title={`${formatTime(e.time_ms)} ${e.type}`} aria-label={t('seekEvent', { time: formatTime(e.time_ms) })} onPointerDown={e => e.stopPropagation()} onClick={() => seek(e.time_ms)} />)}</div>
    <div className="re-selection-overlay" style={{ left: pct(selection.start_ms), width: pct(selection.end_ms - selection.start_ms) }} />
    <div className="re-playhead" style={{ left: pct(time) }} />
  </div></div>;
}

export default function RecordingEditor() {
  return <EditorLanguageProvider><Editor /></EditorLanguageProvider>;
}

function Editor() {
  const { intl, locale, setLocale, t, diagnostic, message: displayMessage } = useEditorI18n();
  const [meetings, setMeetings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [edit, setEdit] = useState({ record_ranges: [], beep_ranges: [] });
  const [history, setHistory] = useState({ past: [], future: [] });
  const [selection, setSelection] = useState({ start_ms: 0, end_ms: 0 });
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [audio, setAudio] = useState(null);
  const [preview, setPreview] = useState(null);
  const [beepPreview, setBeepPreview] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [rebuildReview, setRebuildReview] = useState(false);
  const [resetReview, setResetReview] = useState(false);
  const duration = recording?.duration_ms || 0;
  const dirty = recording && JSON.stringify(edit) !== JSON.stringify({ record_ranges: recording.record_ranges, beep_ranges: recording.beep_ranges });
  const rebuildPending = ['requesting', 'requested'].includes(recording?.rebuild?.status);
  const rebuilding = rebuildPending || recording?.rebuild?.processing;
  const needsRangeSave = recording?.record_ranges_persisted === false;
  const canSaveRaw = dirty || needsRangeSave;
  const rebuildBlock = busy ? t('working') : !recording?.rebuild?.available ? t('rebuildSetup')
    : rebuilding ? t('rebuildBlockedProcessing') : dirty ? t('saveBeforeRebuild')
      : needsRangeSave ? t('saveCandidateRanges') : '';
  const videos = useMemo(() => recording ? externalVideos(recording.events, duration) : [], [recording, duration]);
  const primary = useMemo(() => audio ? audioAdapter(audio, duration) : null, [audio, duration]);
  const getPrimary = useCallback(() => primary, [primary]);
  useAudioPreview(audio, edit.beep_ranges, beepPreview);

  const refreshList = useCallback(async () => {
    try { setMeetings(await request('/recordings')); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { refreshList(); }, [refreshList]);
  useEffect(() => {
    if (!rebuilding) return undefined;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const result = await request(`/recordings/${recording.id}/rebuild`);
        if (cancelled) return;
        if (result.status === 'completed') {
          const data = await request(`/recordings/${recording.id}`);
          if (cancelled) return;
          setRecording(data);
        } else setRecording(current => ({ ...current, rebuild: result }));
        if (result.status === 'completed') setMessage({ id: 'rebuildCompleted' });
        if (['failed', 'command_failed'].includes(result.status)) setError({ id: 'rebuildFailed' });
        await refreshList();
      } catch (e) { if (!cancelled) setError(e.message); }
    }, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [rebuilding, recording?.id, refreshList]);
  useEffect(() => {
    if (!audio) return undefined;
    const tick = () => { setTime(Math.min(duration, audio.currentTime * 1000)); setPlaying(!audio.paused && !audio.ended); };
    const timer = setInterval(tick, 100);
    ['play', 'pause', 'seeking', 'seeked', 'ended'].forEach(name => audio.addEventListener(name, tick));
    return () => { clearInterval(timer); ['play', 'pause', 'seeking', 'seeked', 'ended'].forEach(name => audio.removeEventListener(name, tick)); };
  }, [audio, duration]);

  const seek = useCallback(value => {
    const position = Math.max(0, Math.min(duration, value));
    if (audio) audio.currentTime = position / 1000;
    setTime(position);
  }, [audio, duration]);
  const replaceEdit = useCallback(next => {
    if (busy) return;
    setHistory(h => ({ past: [...h.past, edit].slice(-100), future: [] }));
    setEdit(next); setReview(false); setRebuildReview(false); setResetReview(false); setMessage('');
  }, [edit, busy]);
  const change = (kind, ranges) => replaceEdit({ ...edit, [kind]: normalizeRanges(ranges, duration) });
  const undo = useCallback(() => {
    if (!history.past.length) return;
    setEdit(history.past[history.past.length - 1]);
    setHistory({ past: history.past.slice(0, -1), future: [edit, ...history.future] }); setReview(false); setRebuildReview(false); setResetReview(false);
  }, [edit, history]);
  const redo = () => {
    if (!history.future.length) return;
    setEdit(history.future[0]); setHistory({ past: [...history.past, edit], future: history.future.slice(1) }); setReview(false); setRebuildReview(false); setResetReview(false);
  };
  useEffect(() => {
    const key = e => {
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName) || busy) return;
      if (e.code === 'Space' && audio) { e.preventDefault(); if (audio.paused) audio.play().catch(err => setError(err.message)); else audio.pause(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [audio, busy, undo]);

  const runJob = async (path, payload) => {
    let job = await request(path, payload);
    while (!['done', 'failed'].includes(job.status)) {
      setBusy(job.message || { id: 'working' }); await sleep(700); job = await request(`/jobs/${job.id}`);
    }
    if (job.status === 'failed') throw new Error(job.message);
    return job.result;
  };
  const open = async id => {
    setBusy({ id: 'loadingMedia' }); setError(''); setMessage(''); setReview(false); setRebuildReview(false); setResetReview(false); setBeepPreview(true);
    audio?.pause(); setRecording(null); setPreview(null); setTime(0); setPlaying(false);
    try {
      const data = await request(`/recordings/${id}`);
      setRecording(data);
      setEdit({ record_ranges: data.record_ranges, beep_ranges: data.beep_ranges });
      setHistory({ past: [], future: [] }); setSelection({ start_ms: 0, end_ms: Math.min(10000, data.duration_ms) });
      const generated = await runJob(`/recordings/${id}/preview`, {});
      setPreview(generated);
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const draft = async () => {
    setBusy({ id: 'savingDraft' }); setError('');
    try { await request(`/recordings/${recording.id}/draft`, { ...edit, revision: recording.revision }); setMessage({ id: 'draftSaved' }); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const save = async () => {
    if (rebuilding || busy || !canSaveRaw) return;
    setBusy({ id: 'savingRaw' }); setError(''); audio?.pause();
    try {
      const result = await runJob(`/recordings/${recording.id}/save`, { ...edit, revision: recording.revision });
      const data = await request(`/recordings/${recording.id}`);
      setRecording(data); setEdit({ record_ranges: data.record_ranges, beep_ranges: data.beep_ranges });
      setHistory({ past: [], future: [] }); setReview(false);
      setMessage({ id: 'rawSaved', values: { backup: result.xml_backup } });
      await refreshList();
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const rebuild = async () => {
    if (rebuildBlock) return;
    setBusy({ id: 'requestingRebuild' }); setError(''); audio?.pause();
    try {
      const result = await runJob(`/recordings/${recording.id}/rebuild`, { revision: recording.revision, confirmed: true });
      setRecording(current => ({ ...current, rebuild: result })); setRebuildReview(false);
      setMessage({ id: result.status === 'completed' ? 'rebuildCompleted' : 'rebuildRequested' });
      await refreshList();
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const reset = async () => {
    if (rebuilding || busy || !recording.reset?.available) return;
    const id = recording.id;
    setBusy({ id: 'resetting' }); setError(''); setMessage(''); audio?.pause();
    try {
      await runJob(`/recordings/${id}/reset`, { revision: recording.revision, confirmed: true });
      setPreview(null); setTime(0); setPlaying(false); setBeepPreview(true);
      const data = await request(`/recordings/${id}`);
      setRecording(data); setEdit({ record_ranges: data.record_ranges, beep_ranges: data.beep_ranges });
      setHistory({ past: [], future: [] }); setSelection({ start_ms: 0, end_ms: Math.min(10000, data.duration_ms) });
      setReview(false); setRebuildReview(false); setResetReview(false);
      setPreview(await runJob(`/recordings/${id}/preview`, {}));
      setMessage({ id: data.record_ranges_persisted === false ? 'resetUnmarkedCompleted' : 'resetCompleted' }); await refreshList();
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const activeAssets = recording?.assets.filter(a => a.has_video && !a.error && a.start_ms <= time && time < a.end_ms) || [];
  const screen = activeAssets.find(a => a.kind === 'deskshare');
  const external = videos.find(v => v.timestamp * 1000 <= time && time < v.clear * 1000);
  const validSelection = selection.end_ms > selection.start_ms;

  return <div className="recording-editor">
    <header className="re-header"><div><span className="re-brand">BigBlueButton</span><strong>{t('title')}</strong><span className="re-badge">{t('admin')}</span></div>
      <div className="re-header-actions"><label className="re-language">{t('language')} <select aria-label={t('language')} value={locale} onChange={e => setLocale(e.target.value)}>{languages.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}</select></label>{recording && <><span className="re-dirty">{dirty ? t('unsaved') : needsRangeSave ? t('candidateRanges') : t('saved')}</span><button disabled={!!busy} onClick={draft}>{t('saveDraft')}</button><button className="re-primary" disabled={!!busy || rebuilding || !canSaveRaw} title={!canSaveRaw ? t('rawAlreadySaved') : ''} onClick={() => { setReview(!review); setRebuildReview(false); setResetReview(false); }}>{t('saveRaw')}</button><button disabled={!!rebuildBlock} title={rebuildBlock} aria-describedby={rebuildBlock ? 're-rebuild-reason' : undefined} onClick={() => { setRebuildReview(!rebuildReview); setReview(false); setResetReview(false); }}>{t('rebuildRecording')}</button></>}</div>
    </header>
    <div className="re-shell"><MeetingList meetings={meetings} selectedId={recording?.id} busy={busy} dirty={dirty} onRefresh={refreshList} onOpen={open} /><main className="re-main">
      {busy && <div className="re-notice" role="status">◌ {displayMessage(busy)}</div>}{error && <div className="re-error" role="alert">{displayMessage(error)}</div>}{message && <div className="re-success" role="status">{displayMessage(message)}</div>}
      {!recording ? <div className="re-welcome"><h1>{t('welcomeTitle')}</h1><p>{t('welcomeSelect')}</p><p>{t('welcomeEdit')}</p><p>{t('manualRebuild')}</p></div> : <>
        <div className="re-title"><div><h1>{recording.name || recording.id}</h1><small>{recording.id} · {t('wholeMeeting', { time: formatTime(duration) })}</small></div><a href={recording.published_url} target="_blank" rel="noreferrer">{t('publishedLink')}</a></div>
        {recording.warnings.length > 0 && <details className="re-warnings" open><summary>{t('warnings', { count: recording.warnings.length })}</summary>{recording.warnings.map((w, i) => <p key={i}>{diagnostic(w)}</p>)}</details>}
        {recording.draft?.revision === recording.revision && <div className="re-draft">{t('draftAvailable')} <button disabled={!!busy} onClick={() => replaceEdit({ record_ranges: recording.draft.record_ranges, beep_ranges: recording.draft.beep_ranges })}>{t('loadDraft')}</button></div>}
        {!busy && !dirty && !needsRangeSave && <p className="re-muted">{t('rawAlreadySaved')}</p>}
        {recording.playback_sync === 'needs_rebuild' && !rebuilding && <div className="re-notice" role="status">{t(recording.last_operation === 'reset' ? needsRangeSave ? 'resetUnmarkedCompleted' : 'resetNeedsRebuild' : 'rawNeedsRebuild')}</div>}
        {recording.playback_sync === 'reflected' && !rebuilding && <p className="re-muted">{t('rawReflected')}</p>}
        {rebuildBlock && !busy && <div id="re-rebuild-reason" className="re-warnings"><p>{rebuildBlock}</p>{!recording.rebuild?.available && <><p>{t('rebuildInstallHint')}</p><code>sudo bash editor/deploy/install-rebuild-helper.sh</code></>}</div>}
        {rebuilding && <div className="re-notice" role="status">{t(rebuildPending ? 'rebuildRequested' : 'rebuildBlockedProcessing')}</div>}
        {['failed', 'command_failed'].includes(recording.rebuild?.status) && <div className="re-error" role="alert">{t('rebuildFailed')}</div>}
        <div className="re-reset"><button disabled={!!busy || rebuilding || !recording.reset?.available} onClick={() => { setResetReview(!resetReview); setReview(false); setRebuildReview(false); }}>{t('resetOriginal')}</button>{!recording.reset?.available && <small>{t('resetUnavailable')}</small>}</div>
        {resetReview && <div className="re-review re-reset-review"><h3>{t('resetReviewTitle')}</h3><p>{t('resetReviewDetails')}</p><p className="re-warnings">{t('resetWarning')}</p><p>{t('resetPublished')}</p>
          <button disabled={!!busy || rebuilding} onClick={reset}>{t('confirmReset')}</button><button disabled={!!busy} onClick={() => setResetReview(false)}>{t('close')}</button>
        </div>}
        {rebuildReview && <div className="re-review re-rebuild-review"><h3>{t('rebuildReviewTitle')}</h3><p>{t('rebuildReviewDetails')}</p><p className="re-warnings">{t('rebuildWarning')}</p><p>{t('rebuildPublishedWarning')}</p>
          <button className="re-primary" disabled={!!rebuildBlock} onClick={rebuild}>{t('confirmRebuild')}</button><button disabled={!!busy} onClick={() => setRebuildReview(false)}>{t('close')}</button>
        </div>}
        {review && <div className="re-review"><h3>{t('reviewTitle')}</h3><p>{t('reviewCounts', { record: edit.record_ranges.length, beep: edit.beep_ranges.length })}</p><p>{t('reviewDetails')}</p>
          {edit.beep_ranges.length > 0 && <p className="re-warnings">{t('reviewAudioWarning')}</p>}
          {recording.beep_ranges.length > 0 && !edit.beep_ranges.length && <p>{t('reviewAudioRestore')}</p>}
          {!edit.record_ranges.length && <p className="re-warnings">{t('needRange')}</p>}
          <button className="re-primary" disabled={!!busy || rebuilding || !canSaveRaw || !edit.record_ranges.length} onClick={save}>{t('confirmSave')}</button><button onClick={() => setReview(false)}>{t('close')}</button><small>{t('noRebuild')}</small>
        </div>}
        <div className="re-preview"><div className="re-content-preview">
          {external && primary ? <ExternalVideoPlayer videos={videos} intl={intl} getPrimary={getPrimary} /> : screen ? <VideoPreview clip={screen} time={time} playing={playing} rate={rate} /> : <SlidePreview recording={recording} time={time} />}
        </div><div className="re-cameras">{activeAssets.filter(a => a.kind === 'video').slice(0, 4).map(a => <VideoPreview key={a.id} clip={a} time={time} playing={playing} rate={rate} />)}{!activeAssets.some(a => a.kind === 'video') && <div className="re-placeholder">{t('noCamera')}</div>}</div></div>
        {external && <p className="re-warnings">{t('externalAudio')}</p>}
        <div className="re-transport"><button className="re-play" disabled={!preview || !!busy} onClick={() => { if (audio.paused) audio.play().catch(e => setError(e.message)); else audio.pause(); }}>{playing ? t('pause') : t('play')}</button>
          <TimeField label={t('position')} value={Math.round(time)} max={duration} onChange={seek} onFocus={() => audio?.pause()} /><span>/ {formatTime(duration)}</span>
          <select aria-label={t('speed')} value={rate} onChange={e => { const value = Number(e.target.value); setRate(value); if (audio) audio.playbackRate = value; }}>{[0.5, 1, 1.5, 2].map(r => <option key={r} value={r}>{r}×</option>)}</select>
          <label><input type="checkbox" checked={beepPreview} onChange={e => setBeepPreview(e.target.checked)} /> {t('previewBeep')}</label><span className="re-muted">{t('playOff')}</span>
          {preview && <audio ref={setAudio} src={preview.audio_url} preload="auto" onError={() => setError({ id: 'audioError' })} />}
        </div>
        <div className="re-tools"><button disabled={!history.past.length || !!busy} onClick={undo}>{t('undo')}</button><button disabled={!history.future.length || !!busy} onClick={redo}>{t('redo')}</button><label>{t('zoom')} <select value={zoom} onChange={e => setZoom(Number(e.target.value))}>{[1, 2, 4, 8, 16].map(z => <option key={z} value={z}>{z}×</option>)}</select></label><span className="re-muted">{t('dragHint')}</span></div>
        <Timeline recording={recording} edit={edit} change={change} selection={selection} setSelection={setSelection} time={time} seek={seek} peaks={preview?.peaks} zoom={zoom} />
        <div className="re-selection"><strong>{t('selection')}</strong><TimeField label={t('selectionStart')} value={selection.start_ms} max={duration} onChange={v => { if (v > selection.end_ms) return false; setSelection({ ...selection, start_ms: v }); return true; }} /><span>–</span><TimeField label={t('selectionEnd')} value={selection.end_ms} max={duration} onChange={v => { if (v < selection.start_ms) return false; setSelection({ ...selection, end_ms: v }); return true; }} />
          <button onClick={() => setSelection({ start_ms: Math.round(time), end_ms: Math.max(Math.round(time), selection.end_ms) })}>{t('startHere')}</button><button onClick={() => setSelection({ start_ms: Math.min(selection.start_ms, Math.round(time)), end_ms: Math.round(time) })}>{t('endHere')}</button>
          <button disabled={!validSelection || !!busy} onClick={() => change('record_ranges', [...edit.record_ranges, selection])}>{t('keep')}</button><button disabled={!validSelection || !!busy} onClick={() => change('record_ranges', removeRange(edit.record_ranges, selection, duration))}>{t('exclude')}</button><button className="re-beep-button" disabled={!validSelection || !!busy} onClick={() => change('beep_ranges', [...edit.beep_ranges, selection])}>{t('addBeep')}</button>
        </div>
        <div className="re-bottom"><section className="re-edits"><RangeRows label={t('keepRanges')} ranges={edit.record_ranges} duration={duration} seek={seek} onChange={r => change('record_ranges', r)} /><RangeRows label={t('beepRanges')} ranges={edit.beep_ranges} duration={duration} seek={seek} onChange={r => change('beep_ranges', r)} /></section>
          <section className="re-events"><h3>{t('events')}</h3><div>{recording.events.filter(e => e.time_ms <= time && e.type !== 'AddTldrawShapeEvent').slice(-30).reverse().map((e, i) => <button key={i} onClick={() => seek(e.time_ms)}><time>{formatTime(e.time_ms)}</time><span>{['SendPublicChatEvent', 'PublicChatEvent'].includes(e.type) ? `${e.name || ''}: ${e.message || ''}` : e.type}</span></button>)}</div></section></div>
      </>}
    </main></div>
  </div>;
}
