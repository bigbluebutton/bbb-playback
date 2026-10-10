import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
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
  const [text, setText] = useState(formatTime(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setText(formatTime(value)); setInvalid(false); }, [value]);
  const commit = () => {
    const parsed = parseTime(text);
    if (parsed === null || parsed > max || onChange(parsed) === false) { setInvalid(true); return; }
    setText(formatTime(parsed)); setInvalid(false);
  };
  return <input className={invalid ? 're-time invalid' : 're-time'} aria-label={label} title={invalid ? '会議の範囲内で開始 < 終了となる時刻を入力してください' : '時:分:秒.ミリ秒'}
    value={text} onFocus={onFocus} onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

function RangeRows({ label, ranges, onChange, duration, seek }) {
  return <div className="re-range-list"><h3>{label} <small>{ranges.length}区間</small></h3>
    {!ranges.length && <p className="re-muted">区間なし</p>}
    {ranges.map((r, i) => <div className="re-range-row" key={i}>
      <button title="開始位置へ移動" onClick={() => seek(r.start_ms)}>{i + 1}</button>
      <TimeField label={`${label}${i + 1} 開始`} value={r.start_ms} max={duration} onChange={v => {
        if (v >= r.end_ms) return false;
        onChange(ranges.map((item, index) => index === i ? { ...item, start_ms: v } : item)); return true;
      }} />
      <span>–</span>
      <TimeField label={`${label}${i + 1} 終了`} value={r.end_ms} max={duration} onChange={v => {
        if (v <= r.start_ms) return false;
        onChange(ranges.map((item, index) => index === i ? { ...item, end_ms: v } : item)); return true;
      }} />
      <button title="区間を削除" aria-label={`${label}${i + 1}を削除`} onClick={() => onChange(ranges.filter((_, index) => index !== i))}>×</button>
    </div>)}
  </div>;
}

function Timeline({ recording, edit, change, selection, setSelection, time, seek, peaks, zoom }) {
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
      <button className="re-handle left" aria-label={`${label}${i + 1}開始をドラッグ`} onPointerDown={e => handle(e, kind, i, 'start_ms')} />
      <span>{i + 1}</span>
      <button className="re-handle right" aria-label={`${label}${i + 1}終了をドラッグ`} onPointerDown={e => handle(e, kind, i, 'end_ms')} />
    </div>)}
  </div>;
  return <div className="re-timeline-scroll"><div className="re-timeline" ref={ref} style={{ width: `${zoom * 100}%` }} onPointerDown={select}>
    <div className="re-ruler">{Array.from({ length: 11 }, (_, i) => <span key={i} style={{ left: `${i * 10}%` }}>{formatTime(duration * i / 10).slice(0, 8)}</span>)}</div>
    <div className="re-wave"><span className="re-track-label">会議音声</span><svg viewBox="0 0 2048 64" preserveAspectRatio="none" aria-label="会議音声の波形">
      {(peaks || []).map((p, i) => <line key={i} x1={i} x2={i} y1={32 - Math.min(1, p) * 30} y2={32 + Math.min(1, p) * 30} />)}
    </svg>{!peaks && <span className="re-wave-pending">プレビューの生成後に波形を表示</span>}</div>
    {rangeTrack('record_ranges', '録画に残す')}{rangeTrack('beep_ranges', 'ピー音')}
    {['video', 'deskshare'].map(kind => <div className={`re-track ${kind}`} key={kind}><span className="re-track-label">{kind === 'video' ? 'カメラ' : '画面共有'}</span>
      {recording.assets.filter(a => a.kind === kind).map(a => <div key={a.id} className={`re-clip ${a.error ? 'missing' : ''}`} style={{ left: pct(a.start_ms), width: pct(a.end_ms - a.start_ms) }} title={`${a.relative || a.filename}\n${formatTime(a.start_ms)} – ${formatTime(a.end_ms)}`} onPointerDown={e => e.stopPropagation()} onClick={() => seek(a.start_ms)}>{a.user || kind}</div>)}
    </div>)}
    <div className="re-track re-slide-track"><span className="re-track-label">スライド / 外部動画</span>{recording.events.filter(e => ['SharePresentationEvent', 'GotoSlideEvent', 'StartExternalVideoRecordEvent'].includes(e.type)).map((e, i) => <button key={i} className="re-event-marker" style={{ left: pct(e.time_ms) }} title={`${formatTime(e.time_ms)} ${e.type}`} aria-label={`${formatTime(e.time_ms)}のイベントに移動`} onPointerDown={e => e.stopPropagation()} onClick={() => seek(e.time_ms)} />)}</div>
    <div className="re-selection-overlay" style={{ left: pct(selection.start_ms), width: pct(selection.end_ms - selection.start_ms) }} />
    <div className="re-playhead" style={{ left: pct(time) }} />
  </div></div>;
}

export default function RecordingEditor() {
  const intl = useIntl();
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
  const duration = recording?.duration_ms || 0;
  const dirty = recording && JSON.stringify(edit) !== JSON.stringify({ record_ranges: recording.record_ranges, beep_ranges: recording.beep_ranges });
  const videos = useMemo(() => recording ? externalVideos(recording.events, duration) : [], [recording, duration]);
  const primary = useMemo(() => audio ? audioAdapter(audio, duration) : null, [audio, duration]);
  const getPrimary = useCallback(() => primary, [primary]);
  useAudioPreview(audio, edit.beep_ranges, beepPreview);

  const refreshList = useCallback(async () => {
    try { setMeetings(await request('/recordings')); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { refreshList(); }, [refreshList]);
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
    setEdit(next); setReview(false); setMessage('');
  }, [edit, busy]);
  const change = (kind, ranges) => replaceEdit({ ...edit, [kind]: normalizeRanges(ranges, duration) });
  const undo = useCallback(() => {
    if (!history.past.length) return;
    setEdit(history.past[history.past.length - 1]);
    setHistory({ past: history.past.slice(0, -1), future: [edit, ...history.future] }); setReview(false);
  }, [edit, history]);
  const redo = () => {
    if (!history.future.length) return;
    setEdit(history.future[0]); setHistory({ past: [...history.past, edit], future: history.future.slice(1) }); setReview(false);
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
      setBusy(job.message || '処理中…'); await sleep(700); job = await request(`/jobs/${job.id}`);
    }
    if (job.status === 'failed') throw new Error(job.message);
    return job.result;
  };
  const open = async id => {
    setBusy('会議の素材を読み込んでいます…'); setError(''); setMessage(''); setReview(false);
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
    setBusy('下書きを保存しています…'); setError('');
    try { await request(`/recordings/${recording.id}/draft`, { ...edit, revision: recording.revision }); setMessage('下書きを保存しました。rawデータは変更していません。'); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const save = async () => {
    setBusy('rawデータを保存しています…'); setError(''); audio?.pause();
    try {
      const result = await runJob(`/recordings/${recording.id}/save`, { ...edit, revision: recording.revision });
      const data = await request(`/recordings/${recording.id}`);
      setRecording(data); setEdit({ record_ranges: data.record_ranges, beep_ranges: data.beep_ranges });
      setHistory({ past: [], future: [] }); setReview(false);
      setMessage(`保存しました。XMLバックアップ: ${result.xml_backup}。bbb-recordによる再構築は管理者が手動で行ってください。`);
      await refreshList();
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const activeAssets = recording?.assets.filter(a => a.has_video && !a.error && a.start_ms <= time && time < a.end_ms) || [];
  const screen = activeAssets.find(a => a.kind === 'deskshare');
  const external = videos.find(v => v.timestamp * 1000 <= time && time < v.clear * 1000);
  const validSelection = selection.end_ms > selection.start_ms;

  return <div className="recording-editor">
    <header className="re-header"><div><span className="re-brand">BBB</span><strong>録画エディター</strong><span className="re-badge">管理者用 · raw</span></div>
      <div>{recording && <><span className="re-dirty">{dirty ? '未保存の変更あり' : '保存済み'}</span><button disabled={!!busy} onClick={draft}>下書きを保存</button><button className="re-primary" disabled={!!busy} onClick={() => setReview(!review)}>rawへ保存…</button></>}</div>
    </header>
    <div className="re-shell"><MeetingList meetings={meetings} selectedId={recording?.id} busy={busy} dirty={dirty} onRefresh={refreshList} onOpen={open} /><main className="re-main">
      {busy && <div className="re-notice" role="status">◌ {busy}</div>}{error && <div className="re-error" role="alert">{error}</div>}{message && <div className="re-success" role="status">{message}</div>}
      {!recording ? <div className="re-welcome"><h1>会議の録画区間と音声を編集</h1><p>左の一覧から会議を選んでください。</p><p>録画を残す区間と、ピー音で置き換える区間を指定します。保存時にはバックアップを作成し、events.xmlと参照するraw音声を更新します。</p><p>録画の再構築・公開は管理者が手動で行います。</p></div> : <>
        <div className="re-title"><div><h1>{recording.name || recording.id}</h1><small>{recording.id} · 会議全体 {formatTime(duration)}</small></div><a href={recording.published_url} target="_blank" rel="noreferrer">公開済み録画 ↗</a></div>
        {recording.warnings.length > 0 && <details className="re-warnings" open><summary>素材・形式の警告 ({recording.warnings.length})</summary>{recording.warnings.map((w, i) => <p key={i}>{w}</p>)}</details>}
        {recording.draft?.revision === recording.revision && <div className="re-draft">保存された下書きがあります <button disabled={!!busy} onClick={() => replaceEdit({ record_ranges: recording.draft.record_ranges, beep_ranges: recording.draft.beep_ranges })}>下書きを読み込む</button></div>}
        {review && <div className="re-review"><h3>rawデータへの保存内容</h3><p>録画に残す: {edit.record_ranges.length}区間 ／ ピー音: {edit.beep_ranges.length}区間</p><p>events.xmlをバックアップし、新しい録画開始・停止イベントを書き込みます。ピー音区間に重なるマイク・画面共有の音声は元ファイルをバックアップして別名で生成し、XMLの参照先を更新します。</p>
          {!edit.record_ranges.length && <p className="re-warnings">録画に残す区間を1つ以上指定してください。BBBは空区間を安全に扱えないため、この状態では保存できません。</p>}
          <button className="re-primary" disabled={!!busy || !edit.record_ranges.length} onClick={save}>バックアップを作成して保存</button><button onClick={() => setReview(false)}>閉じる</button><small>bbb-recordは実行しません。</small>
        </div>}
        <div className="re-preview"><div className="re-content-preview">
          {external && primary ? <ExternalVideoPlayer videos={videos} intl={intl} getPrimary={getPrimary} /> : screen ? <VideoPreview clip={screen} time={time} playing={playing} rate={rate} /> : <SlidePreview recording={recording} time={time} />}
        </div><div className="re-cameras">{activeAssets.filter(a => a.kind === 'video').slice(0, 4).map(a => <VideoPreview key={a.id} clip={a} time={time} playing={playing} rate={rate} />)}{!activeAssets.some(a => a.kind === 'video') && <div className="re-placeholder">カメラ映像なし</div>}</div></div>
        {external && <p className="re-warnings">外部動画サービスの音声はraw音声に含まれず、ピー音の保存対象外です。</p>}
        <div className="re-transport"><button className="re-play" disabled={!preview || !!busy} onClick={() => { if (audio.paused) audio.play().catch(e => setError(e.message)); else audio.pause(); }}>{playing ? '❚❚ 一時停止' : '▶ 再生'}</button>
          <TimeField label="再生位置" value={Math.round(time)} max={duration} onChange={seek} onFocus={() => audio?.pause()} /><span>/ {formatTime(duration)}</span>
          <select aria-label="再生速度" value={rate} onChange={e => { const value = Number(e.target.value); setRate(value); if (audio) audio.playbackRate = value; }}>{[0.5, 1, 1.5, 2].map(r => <option key={r} value={r}>{r}×</option>)}</select>
          <label><input type="checkbox" checked={beepPreview} onChange={e => setBeepPreview(e.target.checked)} /> ピー音を試聴</label><span className="re-muted">録画OFFも再生</span>
          {preview && <audio ref={setAudio} src={preview.audio_url} preload="auto" onError={() => setError('プレビュー音声を読み込めません。会議を読み直してください。')} />}
        </div>
        <div className="re-tools"><button disabled={!history.past.length || !!busy} onClick={undo}>↶ 元に戻す</button><button disabled={!history.future.length || !!busy} onClick={redo}>↷ やり直す</button><label>拡大 <select value={zoom} onChange={e => setZoom(Number(e.target.value))}>{[1, 2, 4, 8, 16].map(z => <option key={z} value={z}>{z}×</option>)}</select></label><span className="re-muted">波形をドラッグして区間を選択。区間の両端をドラッグして調整。</span></div>
        <Timeline recording={recording} edit={edit} change={change} selection={selection} setSelection={setSelection} time={time} seek={seek} peaks={preview?.peaks} zoom={zoom} />
        <div className="re-selection"><strong>選択区間</strong><TimeField label="選択開始" value={selection.start_ms} max={duration} onChange={v => { if (v > selection.end_ms) return false; setSelection({ ...selection, start_ms: v }); return true; }} /><span>–</span><TimeField label="選択終了" value={selection.end_ms} max={duration} onChange={v => { if (v < selection.start_ms) return false; setSelection({ ...selection, end_ms: v }); return true; }} />
          <button onClick={() => setSelection({ start_ms: Math.round(time), end_ms: Math.max(Math.round(time), selection.end_ms) })}>開始を現在位置に</button><button onClick={() => setSelection({ start_ms: Math.min(selection.start_ms, Math.round(time)), end_ms: Math.round(time) })}>終了を現在位置に</button>
          <button disabled={!validSelection || !!busy} onClick={() => change('record_ranges', [...edit.record_ranges, selection])}>録画に残す</button><button disabled={!validSelection || !!busy} onClick={() => change('record_ranges', removeRange(edit.record_ranges, selection, duration))}>録画から除外</button><button className="re-beep-button" disabled={!validSelection || !!busy} onClick={() => change('beep_ranges', [...edit.beep_ranges, selection])}>ピー音を追加</button>
        </div>
        <div className="re-bottom"><section className="re-edits"><RangeRows label="録画に残す区間" ranges={edit.record_ranges} duration={duration} seek={seek} onChange={r => change('record_ranges', r)} /><RangeRows label="ピー音で置き換える区間" ranges={edit.beep_ranges} duration={duration} seek={seek} onChange={r => change('beep_ranges', r)} /></section>
          <section className="re-events"><h3>この位置までのイベント</h3><div>{recording.events.filter(e => e.time_ms <= time && e.type !== 'AddTldrawShapeEvent').slice(-30).reverse().map((e, i) => <button key={i} onClick={() => seek(e.time_ms)}><time>{formatTime(e.time_ms)}</time><span>{['SendPublicChatEvent', 'PublicChatEvent'].includes(e.type) ? `${e.name || ''}: ${e.message || ''}` : e.type}</span></button>)}</div></section></div>
      </>}
    </main></div>
  </div>;
}
