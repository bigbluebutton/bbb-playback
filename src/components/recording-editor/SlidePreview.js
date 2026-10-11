import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tldraw, AssetRecordType } from '@bigbluebutton/tldraw';
import '@bigbluebutton/tldraw/tldraw.css';
import { createTldrawImageAsset, createTldrawBackgroundShape } from 'utils/tldraw';
import { slideState } from './model';
import { useEditorI18n } from './i18n';

export default function SlidePreview({ recording, time }) {
  const { t, message } = useEditorI18n();
  const visible = recording.events.filter(e => e.time_ms <= time).length;
  // Reconstruct on event boundaries (including backwards seeks), not every tick.
  const state = useMemo(() => slideState(recording.events, recording.events[visible - 1]?.time_ms ?? -1), [recording.events, visible]);
  const slide = recording.slides.find(s => s.presentation === state.presentation && s.page === state.page);
  const [editor, setEditor] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 1440, height: 1080 });
  const [error, setError] = useState('');
  const container = useRef(null);
  useEffect(() => {
    if (!slide) return undefined;
    let alive = true;
    const image = new Image();
    image.onload = () => {
      if (alive) setDimensions({ width: image.naturalWidth || 1440, height: image.naturalHeight || 1080 });
    };
    image.src = slide.url;
    return () => { alive = false; };
  }, [slide]);

  useEffect(() => {
    if (!editor || !slide) return undefined;
    const ratio = Math.min(1440 / dimensions.width, 1080 / dimensions.height);
    const width = dimensions.width * ratio;
    const height = dimensions.height * ratio;
    const page = editor.getCurrentPageId();
    const assetId = AssetRecordType.createId('editor-background');
    try {
      editor.updateInstanceState({ isReadonly: false });
      editor.deleteShapes([...editor.getCurrentPageShapeIds()]);
      const asset = createTldrawImageAsset(assetId, slide.url, width, height);
      if (editor.getAsset(assetId)) editor.updateAssets([asset]);
      else editor.createAssets([asset]);
      const background = { ...createTldrawBackgroundShape(assetId, page, width, height), parentId: page };
      editor.createShapes([background]);
      let invalid = 0;
      state.shapes.forEach(raw => {
        const { isModerator, ...shape } = raw;
        // BBB arrow bindings can refer to shapes deleted by a later event.
        if (shape.props) {
          shape.props = { ...shape.props };
          ['start', 'end'].forEach(key => {
            if (shape.props[key]?.type === 'point') shape.props[key] = { type: 'point', x: shape.props[key].x, y: shape.props[key].y };
          });
        }
        try { editor.createShapes([{ ...shape, parentId: page }]); } catch { invalid += 1; }
      });
      editor.updateInstanceState({ isReadonly: true });
      setError(invalid ? { id: 'invalidShapes', values: { count: invalid } } : '');
    } catch {
      editor.updateInstanceState({ isReadonly: true });
      setError({ id: 'shapeError' });
    }
    const fit = () => {
      if (!container.current) return;
      const bounds = container.current.getBoundingClientRect();
      const camera = state.camera;
      const w = width * ((camera?.widthRatio || 100) / 100);
      const h = height * ((camera?.heightRatio || 100) / 100);
      const z = Math.min(bounds.width / w, bounds.height / h);
      const x = width * (camera?.xOffset || 0) / 100 + (bounds.width / z - w) / 2;
      const y = height * (camera?.yOffset || 0) / 100 + (bounds.height / z - h) / 2;
      if (Number.isFinite(z) && z > 0) editor.setCamera({ x, y, z });
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(container.current);
    return () => resize.disconnect();
  }, [editor, slide, state, dimensions]);

  if (!slide) return <div className="re-placeholder">{t('noSlide')}</div>;
  return <div className="re-slide" ref={container}>
    <Tldraw hideUi onMount={setEditor} />
    {error && <span className="re-render-warning">{message(error)}</span>}
    <span className="re-slide-label">{t('slide', { page: state.page })}</span>
  </div>;
}
