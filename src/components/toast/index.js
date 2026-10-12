import React, { useEffect, useRef, useState } from 'react';
import { EVENTS } from 'utils/constants';
import './index.scss';

const Toast = () => {
  const [toast, setToast] = useState(null);
  const timeout = useRef();

  useEffect(() => {
    const handleToast = ({ detail }) => {
      if (detail.dismiss) {
        setToast(current => (current && current.key === detail.dismiss ? null : current));
      } else {
        setToast(detail);
      }
    };

    document.addEventListener(EVENTS.TOAST, handleToast);

    return () => {
      document.removeEventListener(EVENTS.TOAST, handleToast);
      clearTimeout(timeout.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(timeout.current);
    if (toast) timeout.current = setTimeout(() => setToast(null), toast.duration);
  }, [toast]);

  return (
    <div
      aria-live="polite"
      className="toast-region"
      role="status"
    >
      {toast ? (
        <div
          className="toast"
          key={toast.id}
        >
          <span className="toast-message">{toast.message}</span>
          {toast.action ? (
            <button
              className="toast-action"
              onClick={() => {
                toast.action.onClick();
                setToast(null);
              }}
              type="button"
            >
              {toast.action.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default Toast;
