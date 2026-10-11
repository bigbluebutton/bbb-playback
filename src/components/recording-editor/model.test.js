import { formatTime, parseTime, normalizeRanges, removeRange, externalVideos, slideState } from './model';

test('millisecond clock and invalid input', () => {
  expect(formatTime(3723045)).toBe('01:02:03.045');
  expect(parseTime('01:02:03.045')).toBe(3723045);
  expect(parseTime('02:03.4')).toBe(123400);
  expect(parseTime('00:60:00')).toBeNull();
});

test('record-off selection splits an existing recording interval', () => {
  expect(removeRange([{ start_ms: 0, end_ms: 6000 }], { start_ms: 2000, end_ms: 4000 }, 6000))
    .toEqual([{ start_ms: 0, end_ms: 2000 }, { start_ms: 4000, end_ms: 6000 }]);
  expect(normalizeRanges([{ start_ms: 0, end_ms: 2000 }, { start_ms: 1000, end_ms: 7000 }], 6000))
    .toEqual([{ start_ms: 0, end_ms: 6000 }]);
});

test('external video states use status as type and state as playing', () => {
  const videos = externalVideos([
    { type: 'StartExternalVideoRecordEvent', time_ms: 1000, url: 'https://example.com/video.mp4' },
    { type: 'UpdateExternalVideoRecordEvent', time_ms: 2000, status: 'seek', state: '0', position: '45', rate: '1' },
    { type: 'StopExternalVideoRecordEvent', time_ms: 5000 },
  ], 6000);
  expect(videos[0].clear).toBe(5);
  expect(videos[0].events[0]).toMatchObject({ timestamp: 2, type: 'seek', playing: false, time: '45' });
});

test('whiteboard partial updates, slide changes, deletions and backwards seeks', () => {
  const events = [
    { type: 'SharePresentationEvent', time_ms: 0, presentation: 'deck', page: 1 },
    { type: 'AddTldrawShapeEvent', time_ms: 100, presentation: 'deck', page: 1, shape_id: 'shape:a', shape: { id: 'shape:a', props: { w: 50, h: 20 }, x: 1 } },
    { type: 'AddTldrawShapeEvent', time_ms: 200, presentation: 'deck', page: 1, shape_id: 'shape:a', shape: { props: { w: 100 }, x: 2 } },
    { type: 'GotoSlideEvent', time_ms: 300, presentation: 'deck', page: 2 },
    { type: 'GotoSlideEvent', time_ms: 400, presentation: 'deck', page: 1 },
    { type: 'DeleteTldrawShapeEvent', time_ms: 500, presentation: 'deck', page: 1, shape_id: 'shape:a' },
  ];
  expect(slideState(events, 450).shapes[0]).toMatchObject({ x: 2, props: { w: 100, h: 20 } });
  expect(slideState(events, 550).shapes).toEqual([]);
  expect(slideState(events, 150).shapes[0].x).toBe(1);
  expect(slideState(events, 350).page).toBe(2);
});
