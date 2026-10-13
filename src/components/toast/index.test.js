import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Toast from './index';
import notify, { dismiss } from 'utils/toast';

describe('toast', () => {
  let container;
  let root;

  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<Toast />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const shown = () => container.textContent;

  it('shows the latest message', () => {
    act(() => notify({ message: 'First' }));
    act(() => notify({ message: 'Second' }));

    expect(shown()).toBe('Second');
  });

  it('takes down a message by its key, and only that one', () => {
    act(() => notify({ key: 'captions', message: 'Getting Spanish captions ready…' }));
    act(() => dismiss('bookmarks'));
    expect(shown()).toBe('Getting Spanish captions ready…');

    act(() => dismiss('captions'));
    expect(shown()).toBe('');
  });

  it('updates a message with the same key in place', () => {
    act(() => notify({ key: 'captions', message: 'Downloading… 10%', progress: 0.1 }));
    const first = container.querySelector('.toast');
    act(() => notify({ key: 'captions', message: 'Downloading… 60%', progress: 0.6 }));

    expect(container.querySelector('.toast')).toBe(first);
    expect(shown()).toBe('Downloading… 60%');
    expect(container.querySelector('.toast-progress > span').style.width).toBe('60%');
  });

  it('shows an open-ended bar while the end is unknown', () => {
    act(() => notify({ key: 'captions', message: 'Getting ready…', progress: 'busy' }));

    expect(container.querySelector('.toast-progress').classList.contains('busy')).toBe(true);
  });

  it('closes after its duration', () => {
    jest.useFakeTimers();
    act(() => notify({ duration: 1000, message: 'Saved' }));
    act(() => jest.advanceTimersByTime(1000));
    jest.useRealTimers();

    expect(shown()).toBe('');
  });
});
