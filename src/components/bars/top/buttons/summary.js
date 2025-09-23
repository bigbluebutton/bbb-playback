import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { defineMessages, useIntl } from 'react-intl';
import Button from 'components/utils/button';
import { ID } from 'utils/constants';

const intlMessages = defineMessages({
    summary: {
        id: 'button.summary.aria',
        description: 'Aria label for the summary button',
    },
});

const TOAST_DELAY_MS = 5000;     // delay before showing the toast
const TOAST_DURATION_MS = 8000;  // used only when autoClose=true

// === UI knobs ===
const TOAST_MAX_WIDTH_PX   = 520;   // width
const TOAST_TOP_OFFSET_PX  = 70;    // distance from top
const PROGRESS_HEIGHT_PX   = 4;     // progress bar thickness
const PROGRESS_LOOP_MS     = 12000; // loop length when not auto-closing
const TOAST_MIN_HEIGHT_PX  = 88;    // <<< increase toast height here

// /presentation/<version>/<ID>  OR fallback to ?meetingId=
const getMeetingId = () => {
    try {
        const u = new URL(window.location.href);
        const m = u.pathname.match(/\/presentation\/\d+(?:\.\d+)?\/([^\/?#]+)/);
        if (m?.[1]) return m[1];
        return u.searchParams.get('meetingId') || u.searchParams.get('meeting_id');
    } catch {
        return null;
    }
};

// Tries a couple of likely API paths until one returns a usable URL
const fetchSummaryUrl = async (meetingId, signal) => {
    const make = (path) => {
        const u = new URL(path, window.location.origin);
        u.searchParams.set('meeting_id', meetingId);
        return u.toString();
    };
    const candidates = [
        'presentations/getSummaryUrl',
        '/presentations/getSummaryUrl',
    ];

    for (const path of candidates) {
        try {
            const resp = await fetch(make(path), {
                method: 'GET',
                signal,
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });
            if (!resp.ok) { console.debug('[Summary] not ok', path, resp.status); continue; }

            const text = await resp.text();
            const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
            const url =
                typeof data === 'string' ? data
                    : (data?.url ?? data?.data?.url ?? null);

            if (url) {
                console.debug('[Summary] URL from', path, '→', url);
                return url;
            }
        } catch (e) {
            if (e?.name !== 'AbortError') console.debug('[Summary] fetch error', path, e);
        }
    }
    return null;
};

/* ===================== TOAST ===================== */

const VARIANTS = {
    info:    { accent: '#5b8cff', accent2: '#7dd3fc', icon: InfoIcon },
    success: { accent: '#10b981', accent2: '#34d399', icon: CheckIcon },
    warn:    { accent: '#f59e0b', accent2: '#fbbf24', icon: WarnIcon },
    error:   { accent: '#ef4444', accent2: '#f87171', icon: ErrorIcon },
};

const TopToast = ({
                      title = 'Meeting summary ready.',
                      hint = 'You can open it now.',
                      onOpen,
                      onClose,
                      variant = 'info',
                      duration = TOAST_DURATION_MS,
                      autoClose = false, // keep until user dismisses
                  }) => {
    const [open, setOpen] = useState(true);
    const [paused, setPaused] = useState(false);
    const startedAt = useRef(null);
    const remaining = useRef(duration);
    const timer = useRef(null);

    const { accent, accent2, icon: Icon } = VARIANTS[variant] || VARIANTS.info;

    const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
    const schedule = (ms) => {
        clear();
        if (!autoClose) return;
        timer.current = setTimeout(() => {
            setOpen(false);
            onClose?.();
        }, ms);
        startedAt.current = performance.now();
    };

    useEffect(() => {
        if (open && autoClose) schedule(remaining.current);
        return clear;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, autoClose]);

    const handleMouseEnter = () => {
        if (!autoClose) return;
        setPaused(true);
        if (startedAt.current != null) {
            const elapsed = performance.now() - startedAt.current;
            remaining.current = Math.max(0, remaining.current - elapsed);
        }
        clear();
    };
    const handleMouseLeave = () => {
        if (!autoClose) return;
        setPaused(false);
        schedule(remaining.current);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setOpen(false);
            onClose?.();
        }
    };

    // basic vertical swipe-to-dismiss on touch
    let touchY = 0;
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
        const dy = e.touches[0].clientY - touchY;
        e.currentTarget.style.transform = `translate(-50%, ${Math.max(0, dy)}px)`;
        e.currentTarget.style.opacity = `${Math.max(0.2, 1 - dy / 200)}`;
    };
    const onTouchEnd = (e) => {
        const dy = e.changedTouches[0].clientY - touchY;
        if (dy > 120) {
            setOpen(false);
            onClose?.();
        } else {
            e.currentTarget.style.transform = 'translate(-50%, 0)';
            e.currentTarget.style.opacity = '1';
        }
    };

    if (!open) return null;

    const toast = (
        <div
            className="bbb-toast"
            role="status"
            aria-live="polite"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
                ['--accent']: accent,
                ['--accent2']: accent2,
                ['--duration']: `${autoClose ? duration : PROGRESS_LOOP_MS}ms`,
                ['--play']: paused ? 'paused' : 'running',
                ['--progressMode']: autoClose ? 'forwards' : 'infinite',
            }}
        >
            <div className="bbb-toast__inner">
        <span className="bbb-toast__icon" aria-hidden="true">
          <Icon />
        </span>

                <div className="bbb-toast__msg" dir="auto">
                    <strong>{title}</strong>
                    {hint ? <span className="bbb-toast__hint"> {hint}</span> : null}
                </div>

                {onOpen && (
                    <button className="bbb-toast__cta" onClick={onOpen}>
                        Open
                    </button>
                )}

                <button
                    className="bbb-toast__close"
                    aria-label="Dismiss notification"
                    title="Dismiss"
                    onClick={() => { setOpen(false); onClose?.(); }}
                >
                    ×
                </button>

                <span className="bbb-toast__glow" aria-hidden="true" />
                <span className="bbb-toast__progress" aria-hidden="true" />
            </div>

            <style>{`
        .bbb-toast {
          --bg: rgba(16,24,43,.92);
          --ink: #e6edf3;
          --muted: #9db1c7;
          --line: rgba(255,255,255,.10);

          position: fixed;
          top: ${TOAST_TOP_OFFSET_PX}px;
          left: 50%;
          transform: translate(-50%, 0);
          width: min(${TOAST_MAX_WIDTH_PX}px, calc(100% - 24px));
          z-index: 2147483647;
          outline: none;
          animation: bbbToastSlideDown 220ms cubic-bezier(.2,.8,.2,1);
        }
        @media (prefers-color-scheme: light) {
          .bbb-toast {
            --bg: rgba(255,255,255,.92);
            --ink: #0f172a;
            --muted: #556581;
            --line: rgba(15,23,42,.08);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bbb-toast { animation: none; }
          .bbb-toast__progress { animation: none !important; }
        }

        .bbb-toast__inner{
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: ${TOAST_MIN_HEIGHT_PX}px;       /* <<< increased height */
          padding: 16px 16px 14px 16px;               /* a bit more padding */
          border-radius: 16px;
          -webkit-backdrop-filter: saturate(1.2) blur(10px);
          backdrop-filter: saturate(1.2) blur(10px);
          background:
            radial-gradient(600px 120px at 10% -10%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 60%),
            radial-gradient(600px 120px at 90% -10%, color-mix(in oklab, var(--accent2) 35%, transparent), transparent 60%),
            var(--bg);
          border: 1px solid var(--line);
          box-shadow: 0 18px 36px rgba(0,0,0,.35);
          color: var(--ink);
        }
        .bbb-toast__icon{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;                 /* bigger icon to match height */
          border-radius: 10px;
          color: var(--accent);
          background: color-mix(in oklab, var(--accent) 18%, transparent);
          border: 1px solid var(--line);
          flex: 0 0 auto;
        }
        .bbb-toast__icon svg { width: 20px; height: 20px; display:block; }

        .bbb-toast__msg{
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex: 1 1 auto;
          min-width: 0;
          font-size: 15px;                            /* slightly larger text */
          line-height: 1.3;
        }
        .bbb-toast__msg strong{
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 60vw;
        }
        .bbb-toast__hint{
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 40vw;
        }

        .bbb-toast__cta{
          appearance: none;
          border: 0;
          padding: 10px 14px;                         /* taller button */
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
          color: #fff;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          box-shadow: 0 6px 18px color-mix(in oklab, var(--accent) 35%, transparent);
          cursor: pointer;
          transition: transform .08s ease, filter .2s ease;
          flex: 0 0 auto;
        }
        .bbb-toast__cta:hover{ filter: brightness(1.05); }
        .bbb-toast__cta:active{ transform: translateY(1px); }

        .bbb-toast__close{
          appearance: none;
          border: 0;
          background: transparent;
          color: var(--ink);
          opacity: .8;
          font-size: 20px;                             /* slightly larger close icon */
          line-height: 1;
          cursor: pointer;
          padding: 6px 8px;                            /* taller tap target */
          border-radius: 10px;
          transition: background-color .2s ease, opacity .2s ease;
          flex: 0 0 auto;
        }
        .bbb-toast__close:hover{ background: rgba(0,0,0,.08); opacity: 1; }
        @media (prefers-color-scheme: dark) {
          .bbb-toast__close:hover{ background: rgba(255,255,255,.08); }
        }

        .bbb-toast__glow{
          position: absolute;
          inset: -1px;
          border-radius: 16px;
          pointer-events: none;
          background:
            radial-gradient(500px 100px at 10% -10%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%),
            radial-gradient(500px 100px at 90% -10%, color-mix(in oklab, var(--accent2) 22%, transparent), transparent 60%);
          filter: blur(10px);
          opacity: .55;
        }
        .bbb-toast__progress{
          position: absolute;
          left: 0; bottom: 0;
          height: ${PROGRESS_HEIGHT_PX}px;
          width: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          transform-origin: left center;
          animation: bbbToastProgress var(--duration) linear var(--progressMode);
          animation-play-state: var(--play);
          opacity: .95;
        }

        @keyframes bbbToastSlideDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes bbbToastProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        @media (max-width: 420px) {
          .bbb-toast__inner { flex-wrap: wrap; padding-right: 10px; }
          .bbb-toast__msg { width: 100%; order: 2; }
          .bbb-toast__cta { order: 3; }
          .bbb-toast__close { order: 4; margin-left: auto; }
        }
      `}</style>
        </div>
    );

    return createPortal(toast, document.body);
};

/* Minimal inline icons */
function InfoIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 5.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm1.6 11h-3.2a.8.8 0 0 1 0-1.6h.8v-4h-.8a.8.8 0 0 1 0-1.6h2.4a.8.8 0 0 1 .8.8v4.8h.8a.8.8 0 0 1 0 1.6Z"/>
        </svg>
    );
}
function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm-1.1 13.7-3.6-3.6 1.13-1.13 2.47 2.47 4.8-4.8 1.13 1.13-5.93 5.93z"/>
        </svg>
    );
}
function WarnIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1.5 20h21L12 3 1.5 20Zm11.25-3h-1.5v-1.5h1.5V17Zm0-3h-1.5V10h1.5v4Z"/>
        </svg>
    );
}
function ErrorIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm3.18 13.18-1.06 1.06L12 13.12l-2.12 2.12-1.06-1.06L10.88 12 8.82 9.94l1.06-1.06L12 10.88l2.12-2.12 1.06 1.06L13.12 12l2.06 2.18Z"/>
        </svg>
    );
}

/* ===================== SUMMARY (uses the new toast) ===================== */

const Summary = () => {
    const intl = useIntl();
    const [summaryUrl, setSummaryUrl] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const toastTimerRef = useRef(null);

    // Fetch summary URL
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        (async () => {
            const meetingId = getMeetingId();
            if (!meetingId) {
                console.debug('[Summary] No meetingId → no toast/button');
                return;
            }
            const url = await fetchSummaryUrl(meetingId, controller.signal);
            if (mounted) setSummaryUrl(url || null);
        })();

        return () => { mounted = false; controller.abort(); };
    }, []);

    // Always schedule a toast whenever we have a URL
    useEffect(() => {
        if (!summaryUrl) return;
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            console.debug('[Summary] Showing toast now');
            setShowToast(true);
        }, TOAST_DELAY_MS);
        return () => { if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); toastTimerRef.current = null; } };
    }, [summaryUrl]);

    if (!summaryUrl) return null;

    const openSummary = () => window.open(summaryUrl, '_blank', 'noopener,noreferrer');

    return (
        <>
            <Button
                aria={intl.formatMessage(intlMessages.summary)}
                circle
                handleOnClick={openSummary}
                icon={ID.SUMMARY}
            />

            {showToast && (
                <TopToast
                    title={intl.formatMessage(intlMessages.summary)}
                    hint=""
                    variant="info"
                    duration={TOAST_DURATION_MS}
                    onOpen={() => { setShowToast(false); openSummary(); }}
                    onClose={() => setShowToast(false)}
                    autoClose={false}
                />
            )}
        </>
    );
};

export default Summary;
