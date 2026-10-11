import { useEffect, useRef } from 'react';

// Schedule mutes in the AudioContext clock, rather than in a UI timer. This
// preview is temporary; the Ruby/FFmpeg output is what BBB rebuild will consume.
export default function useAudioPreview(audio, ranges, enabled) {
  const nodes = useRef(null);
  useEffect(() => {
    if (!audio) return undefined;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return undefined;
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const original = context.createGain();
    const tone = context.createGain();
    const oscillator = context.createOscillator();
    oscillator.frequency.value = 1000;
    tone.gain.value = 0;
    source.connect(original).connect(context.destination);
    oscillator.connect(tone).connect(context.destination);
    oscillator.start();
    nodes.current = { context, original, tone };
    const resume = () => { context.resume().catch(() => {}); };
    audio.addEventListener('play', resume);
    return () => {
      audio.removeEventListener('play', resume);
      nodes.current = null;
      oscillator.stop();
      source.disconnect();
      context.close();
    };
  }, [audio]);

  useEffect(() => {
    if (!audio || !nodes.current) return undefined;
    const { context, original, tone } = nodes.current;
    const schedule = () => {
      const now = context.currentTime;
      const position = audio.currentTime * 1000;
      const rate = audio.playbackRate;
      original.gain.cancelScheduledValues(now);
      tone.gain.cancelScheduledValues(now);
      original.gain.setValueAtTime(1, now);
      tone.gain.setValueAtTime(0, now);
      if (!enabled || audio.paused || audio.ended || audio.readyState < 3 || !rate) return;
      ranges.forEach(range => {
        if (range.end_ms <= position) return;
        const start = now + Math.max(0, range.start_ms - position) / 1000 / rate;
        const end = now + (range.end_ms - position) / 1000 / rate;
        const fade = Math.min(0.005, (end - start) / 2);
        original.gain.setValueAtTime(0, start);
        original.gain.setValueAtTime(1, end);
        tone.gain.setValueAtTime(0, start);
        tone.gain.linearRampToValueAtTime(0.12 * audio.volume, start + fade);
        tone.gain.setValueAtTime(0.12 * audio.volume, end - fade);
        tone.gain.linearRampToValueAtTime(0, end);
      });
    };
    const names = ['play', 'pause', 'seeking', 'seeked', 'ratechange', 'waiting', 'playing', 'ended', 'volumechange'];
    names.forEach(name => audio.addEventListener(name, schedule));
    const timer = setInterval(schedule, 1000);
    schedule();
    return () => { names.forEach(name => audio.removeEventListener(name, schedule)); clearInterval(timer); };
  }, [audio, ranges, enabled]);
}
