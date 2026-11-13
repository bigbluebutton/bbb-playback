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
    hint: {
        id: 'player.summary.hint',
        description: 'Second line of the meeting summary notice',
    },
    open: {
        id: 'player.summary.open',
        description: 'Button that opens the meeting summary',
    },
    dismiss: {
        id: 'player.summary.dismiss',
        description: 'Button that closes the meeting summary notice',
    },
});

const TOAST_DELAY_MS = 5000;     // delay before showing the toast
const TOAST_DURATION_MS = 8000;  // used only when autoClose=true

// === UI knobs ===
const TOAST_MAX_WIDTH_PX   = 520;   // width
const TOAST_TOP_OFFSET_PX  = 70;    // distance from top
const PROGRESS_HEIGHT_PX   = 4;     // progress bar thickness
const TOAST_MIN_HEIGHT_PX  = 88;    // <<< increase toast height here

// /presentation/<version>/<ID>  OR fallback to ?meetingId=
const getMeetingId = () => {
    try {
        const u = new URL(window.location.href);
        const m = u.pathname.match(/\/presentation\/\d+(?:\.\d+)?\/([^/?#]+)/);
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

const TopToast = ({
                      title = 'Meeting summary ready.',
                      hint = 'You can open it now.',
                      onOpen,
                      onClose,
                      variant = 'info',
                      duration = TOAST_DURATION_MS,
                      autoClose = false, // keep until user dismisses
                      openLabel = 'Open',
                      dismissLabel = 'Dismiss',
                  }) => {
    const [open, setOpen] = useState(true);
    const [paused, setPaused] = useState(false);
    const startedAt = useRef(null);
    const remaining = useRef(duration);
    const timer = useRef(null);

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
                '--duration': `${duration}ms`,
                '--play': paused ? 'paused' : 'running',
            }}
        >
            <div className="bbb-toast__inner">
                <span className="bbb-toast__icon" aria-hidden="true">
                    <SummaryIcon />
                </span>

                <div className="bbb-toast__msg" dir="auto">
                    <strong>{title}</strong>
                    {hint ? <span className="bbb-toast__hint">{hint}</span> : null}
                </div>

                {onOpen && (
                    <button className="bbb-toast__cta" onClick={onOpen} type="button">
                        <span>{openLabel}</span>
                        <OpenIcon />
                    </button>
                )}

                <button
                    className="bbb-toast__close"
                    aria-label={dismissLabel}
                    title={dismissLabel}
                    onClick={() => { setOpen(false); onClose?.(); }}
                    type="button"
                >
                    <CloseIcon />
                </button>

                {autoClose ? <span className="bbb-toast__progress" aria-hidden="true" /> : null}
            </div>

            <style>{`
        /* In the player's colors: its theme (light or dark) and brand pink */
        .bbb-toast {
          position: fixed;
          top: ${TOAST_TOP_OFFSET_PX}px;
          left: 50%;
          transform: translate(-50%, 0);
          width: min(${TOAST_MAX_WIDTH_PX}px, calc(100% - 24px));
          z-index: 2147483647;
          outline: none;
          font-family: var(--font-family, inherit);
          animation: bbbToastSlideDown 260ms cubic-bezier(.2,.8,.2,1);
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
          min-height: ${TOAST_MIN_HEIGHT_PX}px;
          padding: 18px 14px 16px 18px;
          padding-inline: 18px 14px;
          border-radius: 18px;
          overflow: hidden;
          background: var(--secondary-background-color, #fff);
          color: var(--secondary-content-color, #1e293b);
          border: 1px solid var(--border-color, rgba(15,23,42,.08));
          box-shadow:
            0 22px 48px -16px var(--accent-glow, rgba(252,37,198,.35)),
            0 10px 28px -12px var(--shadow-color, rgba(15,23,42,.16));
        }
        /* Brand gradient along the top edge */
        .bbb-toast__inner::before{
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 4px;
          background: var(--accent-gradient, linear-gradient(90deg, #DE31AD, #F63CC2));
        }

        .bbb-toast__icon{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px; height: 44px;
          border-radius: 14px;
          color: #fff;
          background: var(--accent-gradient, linear-gradient(90deg, #DE31AD, #F63CC2));
          box-shadow: 0 8px 18px -8px var(--accent-glow, rgba(252,37,198,.35));
          flex: 0 0 auto;
        }
        .bbb-toast__icon svg { width: 22px; height: 22px; display: block; }

        .bbb-toast__msg{
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1 1 auto;
          min-width: 0;
          line-height: 1.3;
        }
        .bbb-toast__msg strong{
          font-size: 15px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }
        .bbb-toast__hint{
          color: var(--muted-content-color, #5a6577);
          font-size: 13px;
        }

        .bbb-toast__cta{
          appearance: none;
          border: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 999px;
          font: inherit;
          font-weight: 700;
          font-size: 14px;
          color: #fff;
          background: var(--accent-gradient, linear-gradient(90deg, #DE31AD, #F63CC2));
          box-shadow: 0 8px 20px -8px var(--accent-glow, rgba(252,37,198,.35));
          cursor: pointer;
          transition: transform .1s ease, filter .2s ease, box-shadow .2s ease;
          flex: 0 0 auto;
          white-space: nowrap;
        }
        .bbb-toast__cta svg { width: 14px; height: 14px; display: block; }
        [dir="rtl"] .bbb-toast__cta svg { transform: scaleX(-1); }
        .bbb-toast__cta:hover{ filter: brightness(1.06); box-shadow: 0 10px 24px -8px var(--accent-glow, rgba(252,37,198,.35)); }
        .bbb-toast__cta:active{ transform: translateY(1px); }
        .bbb-toast__cta:focus-visible{ outline: none; box-shadow: 0 0 0 3px var(--secondary-background-color, #fff), 0 0 0 5px var(--accent-color, #FC25C6); }

        .bbb-toast__close{
          appearance: none;
          border: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: transparent;
          color: var(--muted-content-color, #5a6577);
          cursor: pointer;
          transition: background-color .2s ease, color .2s ease;
          flex: 0 0 auto;
        }
        .bbb-toast__close svg { width: 16px; height: 16px; display: block; }
        .bbb-toast__close:hover{ background: var(--accent-soft, rgba(252,37,198,.1)); color: var(--accent-text-color, #c21391); }
        .bbb-toast__close:focus-visible{ outline: none; box-shadow: 0 0 0 2px var(--accent-color, #FC25C6); }

        /* Time left, only when the notice closes by itself */
        .bbb-toast__progress{
          position: absolute;
          inset: auto 0 0 0;
          height: ${PROGRESS_HEIGHT_PX}px;
          background: var(--accent-gradient, linear-gradient(90deg, #DE31AD, #F63CC2));
          transform-origin: left center;
          animation: bbbToastProgress var(--duration) linear forwards;
          animation-play-state: var(--play);
        }
        [dir="rtl"] .bbb-toast__progress { transform-origin: right center; }

        @keyframes bbbToastSlideDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes bbbToastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }

        @media (max-width: 480px) {
          .bbb-toast { top: 64px; }
          .bbb-toast__inner { flex-wrap: wrap; gap: 12px; padding: 16px; }
          .bbb-toast__msg { flex-basis: calc(100% - 100px); }
          .bbb-toast__cta { order: 3; flex: 1 1 auto; justify-content: center; }
          .bbb-toast__close { position: absolute; top: 10px; inset-inline-end: 8px; }
        }
      `}</style>
        </div>
    );

    return createPortal(toast, document.body);
};

/* Minimal inline icons */
function SummaryIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h4" />
        </svg>
    );
}
function OpenIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
        </svg>
    );
}
function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
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
                    hint={intl.formatMessage(intlMessages.hint)}
                    openLabel={intl.formatMessage(intlMessages.open)}
                    dismissLabel={intl.formatMessage(intlMessages.dismiss)}
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
