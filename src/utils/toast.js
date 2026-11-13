import { EVENTS } from 'utils/constants';

const DURATION = 4000;

// Shows a short, non-blocking message. `action` is an optional
// { label, onClick } rendered as a button inside the toast; `key` lets the
// message be updated in place and taken down early with dismiss();
// `progress` adds a bar, from 0 to 1, or 'busy' while the end is unknown
const notify = ({
  action = null,
  duration = DURATION,
  key = null,
  message,
  progress = null,
}) => {
  if (!message) return;

  const event = new CustomEvent(EVENTS.TOAST, {
    detail: {
      action,
      duration,
      id: Date.now(),
      key,
      message,
      progress,
    },
  });
  document.dispatchEvent(event);
};

// Takes down the message shown with `key`, if it is still showing
const dismiss = (key) => {
  document.dispatchEvent(new CustomEvent(EVENTS.TOAST, { detail: { dismiss: key } }));
};

export { dismiss };
export default notify;
