import { useEffect } from 'react';

const DOUBLE_TAP = 300;
const DISTANCE = 40;
const AREAS = '.top-content, .webcams-wrapper';
const SLIDES = '.top-content';
const IGNORE = 'button, a, input, select, textarea, [role="button"], .vjs-control-bar, .vjs-menu, .vjs-modal-dialog, .vjs-error-display, .modal-wrapper';

// Tap or click the slide or video to play or pause, and double-tap its left
// or right side to seek, like mobile video apps. Each shows a short ripple
const showRipple = (area, className, html) => {
  const ripple = document.createElement('div');
  ripple.className = className;
  ripple.setAttribute('aria-hidden', 'true');
  ripple.innerHTML = html;
  area.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
};

const showSeek = (area, side, label) => showRipple(
  area,
  `tap-seek tap-seek-${side}`,
  `<span class="tap-seek-arrows">${side === 'back' ? '◀◀' : '▶▶'}</span><span>${label}</span>`,
);

const showToggle = (area, playing) => showRipple(
  area,
  `tap-toggle ${playing ? 'tap-toggle-play' : 'tap-toggle-pause'}`,
  '<span class="tap-toggle-icon"></span>',
);

const getArea = (target) => {
  if (!target || typeof target.closest !== 'function' || target.closest(IGNORE)) return null;

  return target.closest(AREAS);
};

const isNear = (a, b) => Math.abs(a.clientX - b.clientX) < DISTANCE
  && Math.abs(a.clientY - b.clientY) < DISTANCE;

const useTapGestures = ({ backward, forward, isPaused, seconds, toggle }) => {
  useEffect(() => {
    let down = null;
    let last = null;
    let pending = null;

    const runToggle = (area) => {
      const wasPaused = isPaused();
      if (wasPaused === null) return;

      toggle();
      showToggle(area, wasPaused);
    };

    const handleDown = (event) => {
      down = event.isPrimary ? { clientX: event.clientX, clientY: event.clientY } : null;
    };

    const handleUp = (event) => {
      // Drags (selecting, scrolling) and other mouse buttons are not taps
      if (!event.isPrimary || event.button > 0 || !down || !isNear(down, event)) return;
      down = null;

      const area = getArea(event.target);
      if (!area) return;

      const isTouch = event.pointerType === 'touch';
      const isSlides = area.matches(SLIDES);

      // A click on the video already plays and pauses it (video.js)
      if (!isTouch) {
        if (isSlides) runToggle(area);
        return;
      }

      const now = Date.now();
      const isDouble = last
        && last.area === area
        && now - last.time < DOUBLE_TAP
        && isNear(last, event);

      if (isDouble) {
        // The second tap of a double tap seeks instead of toggling twice
        clearTimeout(pending);
        pending = null;
        last = null;

        const rect = area.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;

        // Screen sides, the same for every language like on video apps
        if (ratio < 0.4) {
          backward();
          showSeek(area, 'back', `−${seconds}s`);
        } else if (ratio > 0.6) {
          forward();
          showSeek(area, 'forward', `+${seconds}s`);
        }
        return;
      }

      last = {
        area,
        clientX: event.clientX,
        clientY: event.clientY,
        time: now,
      };

      // Waits to tell a single tap from the first of a double tap
      clearTimeout(pending);
      pending = setTimeout(() => {
        pending = null;
        runToggle(area);
      }, DOUBLE_TAP);
    };

    const handleCancel = () => {
      down = null;
    };

    // Capture: whiteboards may stop their own pointer events
    document.addEventListener('pointerdown', handleDown, true);
    document.addEventListener('pointerup', handleUp, true);
    document.addEventListener('pointercancel', handleCancel, true);

    return () => {
      clearTimeout(pending);
      document.removeEventListener('pointerdown', handleDown, true);
      document.removeEventListener('pointerup', handleUp, true);
      document.removeEventListener('pointercancel', handleCancel, true);
    };
  }, [backward, forward, isPaused, seconds, toggle]);
};

export default useTapGestures;
